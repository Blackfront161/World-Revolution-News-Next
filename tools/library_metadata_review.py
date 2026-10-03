"""Bounded, offline metadata adapters. Output is a review queue, never an admission."""
from __future__ import annotations
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, urlunsplit, unquote

MAX_BYTES = 3 * 1024 * 1024
MAX_RECORDS = 200
SOURCES = {
    'libcom-library': ('libcom.org', 'html-title-index'),
    'kate-sharpley-library': ('www.katesharpleylibrary.net', 'xml-feed'),
    'zabalaza-books': ('zabalazabooks.net', 'xml-feed'),
    'anarchist-archive': ('anarchist-archive.org', 'xml-feed'),
    'anarchist-library-de': ('de.anarchistlibraries.net', 'opds'),
}
ATOM = '{http://www.w3.org/2005/Atom}'
DC = ['{http://purl.org/dc/terms/}language', '{http://purl.org/dc/elements/1.1/}language']

def plain(value, cap=500):
    value = ' '.join(str(value or '').split())
    return value if value and len(value) <= cap and not any(ord(c) < 32 or ord(c) == 127 for c in value) else ''

def original_url(value, page_url, host):
    if not isinstance(value, str) or not value.strip() or len(value) > 4096 or any(ord(c) <= 32 or ord(c) == 127 for c in value) or any(ord(c)<32 or ord(c)==127 for c in unquote(value)):
        return ''
    try:
        parsed = urlsplit(urljoin(page_url, value))
        if parsed.scheme != 'https' or parsed.hostname != host or parsed.username or parsed.password or parsed.port not in (None, 443):
            return ''
        return urlunsplit(parsed._replace(fragment=''))
    except ValueError:
        return ''

def text(node):
    return plain(''.join(node.itertext())) if node is not None else ''

class TitleIndex(HTMLParser):
    """Only index title anchors; navigation, article bodies and files are excluded."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.anchor = None
        self.records = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        scoped = tag in ('h2', 'h3') or 'views-field-title' in attrs.get('class', '').split() or attrs.get('id') == 'block-libcomolivero-content'
        self.stack.append((tag, scoped))
        if tag == 'a' and any(flag for _, flag in self.stack):
            self.anchor = [attrs.get('href', ''), []]
    def handle_endtag(self, tag):
        if tag == 'a' and self.anchor:
            href, parts = self.anchor
            self.records.append((href, plain(''.join(parts))))
            self.anchor = None
        for i in range(len(self.stack)-1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break
    def handle_data(self, value):
        if self.anchor:
            self.anchor[1].append(value)

def extract_candidates(source_id, page_url, body):
    if source_id not in SOURCES or not isinstance(body, bytes) or len(body) > MAX_BYTES:
        raise ValueError('metadata-input-bound')
    host, adapter = SOURCES[source_id]
    if original_url(page_url, page_url, host) != page_url:
        raise ValueError('metadata-original-host')
    rows, rejected, tombstones, navigation, next_navigation = [], [], [], [], []
    if adapter == 'html-title-index':
        if urlsplit(page_url).path.rstrip('/') != '/book':
            raise ValueError('metadata-index-path')
        parser = TitleIndex()
        parser.feed(body.decode('utf-8', errors='strict'))
        for href, title in parser.records:
            url = original_url(href, page_url, host)
            if not url or not re.match(r'^/(?:library|article)/[^/]+', urlsplit(url).path) or not title:
                continue
            rows.append(dict(title=title, url=url, upstream_id=url, authors=[], languages=['und'], creator=None))
    else:
        if re.search(br'<!\s*(?:DOCTYPE|ENTITY)\b', body, re.I):
            raise ValueError('metadata-xml-declarations')
        root = ET.fromstring(body)
        if root.tag not in (ATOM+'feed', 'rss', '{http://www.w3.org/1999/02/22-rdf-syntax-ns#}RDF'):
            raise ValueError('metadata-not-a-feed')
        for link in root.iter(ATOM+'link'):
            mime, relation = link.get('type', ''), link.get('rel', '')
            url = original_url(link.get('href'), page_url, host)
            if url and 'atom+xml' in mime and (relation == 'http://opds-spec.org/sort/new' or 'kind=acquisition' in mime):
                navigation.append(url)
                if relation in ('next', 'http://opds-spec.org/sort/new'):
                    next_navigation.append(url)
        entries = root.findall(ATOM+'entry') if root.tag == ATOM+'feed' else root.findall('./channel/item')
        for index, entry in enumerate(entries):
            is_atom = entry.tag == ATOM+'entry'
            title = text(entry.find(ATOM+'title' if is_atom else 'title'))
            if is_atom:
                links = entry.findall(ATOM+'link')
                urls = [original_url(link.get('href'), page_url, host) for link in links if link.get('rel') == 'alternate' and link.get('type','text/html').split(';')[0] in ('text/html','application/xhtml+xml')]
                if adapter == 'opds' and not any(urls):
                    urls += [original_url(link.get('href'), page_url, host) for link in links if link.get('rel','').startswith('http://opds-spec.org/acquisition') and link.get('type') in ('application/epub+zip','application/pdf')]
                authors = [text(author.find(ATOM+'name')) for author in entry.findall(ATOM+'author')]
                guid = text(entry.find(ATOM+'id'))
            else:
                urls = [original_url(text(entry.find('link')), page_url, host)]
                authors = []  # RSS uploader/creator is not a verified book author.
                guid = text(entry.find('guid'))
                guid_node = entry.find('guid')
                if guid_node is not None and guid_node.get('isPermaLink', 'true').lower() != 'false':
                    urls.append(original_url(guid, page_url, host))
            url = next((value for value in urls if value), '')
            if not title or not url:
                references = [link.get('href','') for link in links] if is_atom else [text(entry.find('link'))]
                non_https = []
                for reference in references:
                    try:
                        parsed = urlsplit(reference)
                        if parsed.scheme == 'http' and parsed.hostname == host and not parsed.username and not parsed.password and len(reference)<=4096:
                            non_https.append(reference)
                    except ValueError:
                        pass
                rejected.append({'entry': index, 'title': title, 'reason': 'non-https-original' if non_https else 'missing-title-or-safe-original', 'unverifiedOriginalReferences':non_https[:2]})
                continue
            languages = [text(entry.find(tag)) for tag in DC]
            languages = list(dict.fromkeys(v.lower() for v in languages if re.fullmatch(r'[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*', v)))
            declared = entry.get('{http://www.w3.org/XML/1998/namespace}lang', '')
            if not languages and re.fullmatch(r'[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*', declared):
                languages = [declared.lower()]
            creator = text(entry.find('{http://purl.org/dc/elements/1.1/}creator')) or None
            rows.append(dict(title=title, url=url, upstream_id=guid or url, authors=[v for v in authors if v][:10], languages=languages or ['und'], creator=creator))
        for tombstone in root.iter('{http://purl.org/atompub/tombstones/1.0}deleted-entry'):
            ref = plain(tombstone.get('ref'))
            if ref:
                tombstones.append({'upstreamId': ref, 'disposition': 'explicit-withdrawal-review-required'})
    candidates, seen, seen_urls, conflicts = [], {}, {}, []
    for row in rows:
        candidate_id = source_id+'-'+hashlib.sha256(row['upstream_id'].encode('utf-8')).hexdigest()[:24]
        if candidate_id in seen:
            if seen[candidate_id] != row:
                conflicts.append({'id': candidate_id, 'reason': 'same-upstream-id-different-metadata'})
            continue
        seen[candidate_id] = row
        if row['url'] in seen_urls and seen_urls[row['url']] != candidate_id:
            conflicts.append({'id':candidate_id,'existingId':seen_urls[row['url']],'reason':'same-original-different-upstream-id'})
            continue
        seen_urls[row['url']] = candidate_id
        if len(candidates) >= MAX_RECORDS:
            continue
        candidates.append({
            'id': candidate_id, 'sourceId': source_id, 'title': row['title'], 'originalUrl': row['url'],
            'upstreamId': row['upstream_id'], 'authors': row['authors'], 'languages': row['languages'],
            'feedCreator': row['creator'], 'edition': None, 'status': 'needs-individual-review',
            'originalReferenceKind': 'file-reference' if urlsplit(row['url']).path.endswith(('.epub','.pdf')) else 'page-reference',
            'scope': 'metadata-original-link-review-only',
            'requirements': ['publisher-original-and-author-review', 'edition-and-duplicate-review', 'source-rights-and-revocation-review'],
        })
    return {'schema':'wrn.library-metadata-review.v1', 'sourceId':source_id, 'adapter':adapter,
            'inputSha256':hashlib.sha256(body).hexdigest(), 'inputBytes':len(body),
            'candidates':candidates, 'rejected':rejected[:MAX_RECORDS], 'identityConflicts':conflicts[:MAX_RECORDS],
            'tombstones':tombstones[:MAX_RECORDS], 'navigation':list(dict.fromkeys(navigation))[:3],
            'nextNavigation':list(dict.fromkeys(next_navigation))[:1],
            'truncated':len(seen)>MAX_RECORDS, 'admissionPerformed':False, 'mediaFetched':False}

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    try:
        raw = sys.stdin.buffer.read(MAX_BYTES+1)
        print(json.dumps(extract_candidates(sys.argv[1],sys.argv[2],raw),ensure_ascii=False))
    except (ValueError, ET.ParseError, UnicodeError, IndexError) as error:
        print(json.dumps({'status':'unusable-metadata','errorType':type(error).__name__,'reason':str(error)[:160]}))
        sys.exit(1)
