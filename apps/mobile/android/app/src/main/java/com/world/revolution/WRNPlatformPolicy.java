package com.world.revolution;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

/** Pure Java allowlists for the WebView bridge; no Android URI mocks are needed. */
final class WRNPlatformPolicy {
    private static final int MAX_INPUT_LENGTH = 256;
    private static final Pattern SAFE_ARTICLE_ID = Pattern.compile(
        "^(?:wrn-test-art|wrn-art)-[a-z0-9]+(?:-[a-z0-9]+)*$"
    );
    private static final Set<String> TARGETS = new HashSet<>(Arrays.asList(
        "home", "following", "discover", "media", "events", "knowledge", "solidarity",
        "saved", "more", "help"
    ));

    private boolean webReady;
    private long nextBackRequestId;
    private long nextRouteDeliveryId;
    private String activeBackRequestId;

    String parseDeepLink(String raw) {
        if (raw == null || raw.length() == 0 || raw.length() > MAX_INPUT_LENGTH || raw.contains("%")) {
            return null;
        }
        try {
            URI uri = new URI(raw);
            if (!"com.world.revolution".equals(uri.getScheme()) ||
                !"open".equals(uri.getHost()) ||
                uri.getRawUserInfo() != null || uri.getPort() != -1 ||
                uri.getRawQuery() != null || uri.getRawFragment() != null) {
                return null;
            }
            return parseRoute(uri.getRawPath());
        } catch (URISyntaxException exception) {
            return null;
        }
    }

    String canonicalShareUrl(String raw) {
        if (raw == null || raw.length() == 0 || raw.length() > MAX_INPUT_LENGTH || raw.contains("%")) {
            return null;
        }
        try {
            URI uri = new URI(raw);
            if (!"https".equals(uri.getScheme()) ||
                !"solinaridao.com".equals(uri.getHost()) ||
                uri.getRawUserInfo() != null || uri.getPort() != -1 ||
                uri.getRawQuery() != null || uri.getRawFragment() != null) {
                return null;
            }
            String path = uri.getRawPath();
            if (path == null || !path.startsWith("/articles/") || !path.endsWith("/")) return null;
            String id = path.substring("/articles/".length(), path.length() - 1);
            String canonical = "https://solinaridao.com/articles/" + id + "/";
            return isSafeArticleId(id) && canonical.equals(raw) ? canonical : null;
        } catch (URISyntaxException exception) {
            return null;
        }
    }

    void setWebReady(boolean ready) {
        webReady = ready;
        if (!ready) activeBackRequestId = null;
    }

    String createBackRequestId() {
        if (!webReady) return null;
        activeBackRequestId = String.valueOf(++nextBackRequestId);
        return activeBackRequestId;
    }

    boolean consumeBackAcknowledgement(String requestId) {
        if (activeBackRequestId == null || !activeBackRequestId.equals(requestId)) return false;
        activeBackRequestId = null;
        return true;
    }

    String nextRouteDeliveryId() {
        return String.valueOf(++nextRouteDeliveryId);
    }

    private String parseRoute(String path) {
        if (path == null || path.length() == 0 || path.length() > 160 || !path.startsWith("/")) return null;
        String route = path.substring(1);
        if (TARGETS.contains(route)) return route;
        if ("discover/news".equals(route) || "discover/sources".equals(route) || "discover/sport".equals(route)) {
            return route;
        }
        if ("archive".equals(route)) return route;
        if (route.startsWith("article/")) {
            String id = route.substring("article/".length());
            return isSafeArticleId(id) ? route : null;
        }
        if (route.startsWith("archive/")) {
            String id = route.substring("archive/".length());
            return isSafeArticleId(id) ? route : null;
        }
        return null;
    }

    private static boolean isSafeArticleId(String value) {
        return SAFE_ARTICLE_ID.matcher(value).matches();
    }
}
