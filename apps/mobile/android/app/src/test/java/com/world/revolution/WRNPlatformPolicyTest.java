package com.world.revolution;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class WRNPlatformPolicyTest {
    @Test
    public void acceptsOnlyExplicitAppOwnedLinks() {
        WRNPlatformPolicy policy = new WRNPlatformPolicy();
        assertEquals("discover/sources", policy.parseDeepLink("com.world.revolution://open/discover/sources"));
        assertEquals("article/wrn-art-future-item", policy.parseDeepLink("com.world.revolution://open/article/wrn-art-future-item"));
        assertNull(policy.parseDeepLink("https://open/discover/sources"));
        assertNull(policy.parseDeepLink("com.world.revolution://open/discover/sources?track=1"));
        assertNull(policy.parseDeepLink("com.world.revolution://open/article/wrn-art-good%2fbad"));
        assertNull(policy.parseDeepLink("com.world.revolution://open/../help"));
    }

    @Test
    public void acceptsOnlyExactCanonicalShareUrls() {
        WRNPlatformPolicy policy = new WRNPlatformPolicy();
        assertEquals(
            "https://solinaridao.com/articles/wrn-test-art-cedar/",
            policy.canonicalShareUrl("https://solinaridao.com/articles/wrn-test-art-cedar/")
        );
        assertNull(policy.canonicalShareUrl("https://solinaridao.com/articles/wrn-test-art-cedar/?x=1"));
        assertNull(policy.canonicalShareUrl("https://solinaridao.com/articles/wrn-test-art-cedar%2fextra/"));
        assertNull(policy.canonicalShareUrl("https://other.example/articles/wrn-test-art-cedar/"));
    }

    @Test
    public void requiresTheCurrentBackRequestAcknowledgement() {
        WRNPlatformPolicy policy = new WRNPlatformPolicy();
        assertNull(policy.createBackRequestId());
        policy.setWebReady(true);
        String first = policy.createBackRequestId();
        String second = policy.createBackRequestId();
        assertFalse(policy.consumeBackAcknowledgement(first));
        assertTrue(policy.consumeBackAcknowledgement(second));
        assertFalse(policy.consumeBackAcknowledgement(second));
        String pending = policy.createBackRequestId();
        policy.setWebReady(false);
        assertFalse(policy.consumeBackAcknowledgement(pending));
        policy.setWebReady(true);
        assertFalse(policy.consumeBackAcknowledgement(pending));
        String afterRearm = policy.createBackRequestId();
        assertTrue(policy.consumeBackAcknowledgement(afterRearm));
        assertFalse(policy.consumeBackAcknowledgement(afterRearm));
        policy.setWebReady(false);
        assertNull(policy.createBackRequestId());
    }
}
