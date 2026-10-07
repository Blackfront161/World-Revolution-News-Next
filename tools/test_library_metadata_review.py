import unittest
from library_metadata_review import extract_candidates, MAX_BYTES

class LibraryMetadataReviewTests(unittest.TestCase):
    def rss(self, content, source='zabalaza-books', host='zabalazabooks.net'):
        return extract_candidates(source, 'https://'+host+'/feed/', ('<rss xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><language>en</language>'+content+'</channel></rss>').encode())
    def test_four_adapters_stay_candidate_only(self):
        for source,url,body in [
            ('libcom-library','https://libcom.org/book',b'<h2><a href="/library/test">Test book</a></h2>'),
            ('kate-sharpley-library','https://www.katesharpleylibrary.net/feeds/recent-documents',b'<rss><channel><item><title>Test</title><link>https://www.katesharpleylibrary.net/example</link></item></channel></rss>'),
            ('zabalaza-books','https://zabalazabooks.net/feed/',b'<rss><channel><item><title>Test</title><link>https://zabalazabooks.net/test/</link></item></channel></rss>'),
            ('anarchist-archive','https://anarchist-archive.org/feed/rss.de.xml',b'<rss><channel><item><title>Test</title><link>https://anarchist-archive.org/library/de/test</link></item></channel></rss>'),
        ]:
            with self.subTest(source=source):
                result=extract_candidates(source,url,body)
                self.assertEqual(len(result['candidates']),1)
                self.assertFalse(result['admissionPerformed'])
                self.assertFalse(result['mediaFetched'])
                self.assertEqual(result['candidates'][0]['status'],'needs-individual-review')
    def test_channel_language_and_rss_creator_do_not_become_book_language_or_author(self):
        row=self.rss('<item><title>Test</title><link>https://zabalazabooks.net/test/</link><dc:creator>Site uploader</dc:creator><description>Forbidden body</description></item>')['candidates'][0]
        self.assertEqual(row['languages'],['und'])
        self.assertEqual(row['authors'],[])
        self.assertEqual(row['feedCreator'],'Site uploader')
        self.assertNotIn('Forbidden body',str(row))
    def test_missing_link_never_resolves_to_the_feed_itself(self):
        result=self.rss('<item><title>No link</title></item>')
        self.assertEqual(result['candidates'],[])
    def test_explicit_rss_permalink_can_bind_an_original_but_opaque_guid_cannot(self):
        row=self.rss('<item><title>Test</title><guid>https://zabalazabooks.net/test/</guid></item>')['candidates'][0]
        self.assertEqual(row['originalUrl'],'https://zabalazabooks.net/test/')
        result=self.rss('<item><title>Test</title><guid isPermaLink="false">https://zabalazabooks.net/test/</guid></item>')
        self.assertEqual(result['candidates'],[])
    def test_item_language_is_explicit_and_bound(self):
        row=self.rss('<item><title>Test</title><link>https://zabalazabooks.net/test/</link><dc:language>de</dc:language></item>')['candidates'][0]
        self.assertEqual(row['languages'],['de'])
        self.assertIsNone(row['edition'])
    def test_opds_authors_and_declared_language_keep_the_original_identity(self):
        xml=b'<feed xmlns="http://www.w3.org/2005/Atom" xmlns:dcterms="http://purl.org/dc/terms/"><entry><id>stable-guid</id><title>Test</title><author><name>Author</name></author><dcterms:language>de</dcterms:language><link rel="alternate" type="text/html" href="https://de.anarchistlibraries.net/library/test"/><content>Forbidden book body</content></entry></feed>'
        result=extract_candidates('anarchist-library-de','https://de.anarchistlibraries.net/opds/new',xml)
        row=result['candidates'][0]
        self.assertEqual(row['authors'],['Author']);self.assertEqual(row['languages'],['de'])
        self.assertEqual(row['upstreamId'],'stable-guid');self.assertNotIn('Forbidden book body',str(result))
    def test_epub_only_opds_keeps_a_file_reference_without_fetching_the_file(self):
        xml=b'<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>book-guid</id><title>Test</title><link rel="http://opds-spec.org/acquisition" type="application/epub+zip" href="https://de.anarchistlibraries.net/library/test.epub"/></entry></feed>'
        result=extract_candidates('anarchist-library-de','https://de.anarchistlibraries.net/opds/new',xml)
        self.assertEqual(result['candidates'][0]['originalUrl'],'https://de.anarchistlibraries.net/library/test.epub')
        self.assertFalse(result['mediaFetched'])
    def test_original_host_credentials_and_non_https_are_rejected(self):
        for url in ['http://zabalazabooks.net/test/','https://user:secret@zabalazabooks.net/test/','https://evil.example/test/','https://zabalazabooks.net:8443/test/']:
            with self.subTest(url=url):
                self.assertEqual(self.rss('<item><title>Test</title><link>'+url+'</link></item>')['candidates'],[])
    def test_untrusted_xml_declarations_and_oversized_bodies_are_rejected(self):
        for body in [b'<!DOCTYPE rss><rss/>', b'<!ENTITY bomb "x"><rss/>',b'x'*(MAX_BYTES+1)]:
            with self.assertRaises(ValueError):
                extract_candidates('zabalaza-books','https://zabalazabooks.net/feed/',body)
    def test_guid_conflicts_stay_explicit_and_are_not_overwritten(self):
        result=self.rss('<item><guid>same</guid><title>First</title><link>https://zabalazabooks.net/a/</link></item><item><guid>same</guid><title>Second</title><link>https://zabalazabooks.net/b/</link></item>')
        self.assertEqual(len(result['candidates']),1);self.assertEqual(result['candidates'][0]['title'],'First')
        self.assertEqual(len(result['identityConflicts']),1)
    def test_shared_original_does_not_become_two_different_works(self):
        result=self.rss('<item><guid>one</guid><title>One</title><link>https://zabalazabooks.net/a/</link></item><item><guid>two</guid><title>Two</title><link>https://zabalazabooks.net/a/</link></item>')
        self.assertEqual(len(result['candidates']),1)
        self.assertEqual(result['identityConflicts'][0]['reason'],'same-original-different-upstream-id')
    def test_candidate_count_is_bounded_without_interpreting_truncation_as_deletion(self):
        result=self.rss(''.join('<item><title>Book '+str(i)+'</title><link>https://zabalazabooks.net/'+str(i)+'/</link></item>' for i in range(201)))
        self.assertEqual(len(result['candidates']),200);self.assertTrue(result['truncated']);self.assertEqual(result['tombstones'],[])
    def test_html_adapter_excludes_navigation_files_and_foreign_originals(self):
        html=b'<nav><a href="/library/menu">Menu</a></nav><h2><a href="/library/book">Book</a></h2><h2><a href="https://evil.example/library/book">Other</a></h2><h2><a href="/files/book.pdf">PDF</a></h2>'
        rows=extract_candidates('libcom-library','https://libcom.org/book',html)['candidates']
        self.assertEqual([r['title'] for r in rows],['Book'])
    def test_unknown_source_cannot_select_an_arbitrary_provider(self):
        with self.assertRaises(ValueError):
            extract_candidates('invented','https://example.org/',b'<rss/>')
    def test_absence_does_not_delete_existing_records(self):
        result=self.rss('')
        self.assertEqual(result['candidates'],[]);self.assertEqual(result['tombstones'],[])

if __name__ == '__main__': unittest.main()
