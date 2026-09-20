package com.world.revolution;

import static org.junit.Assert.*;
import org.junit.Test;

public class WRNAppUpdatePolicyTest {
    @Test public void onlyCriticalAllowedUpdatesUseImmediateFlow() {
        assertEquals(WRNAppUpdatePolicy.Flow.FLEXIBLE, WRNAppUpdatePolicy.choose(false, 3, true, true));
        assertEquals(WRNAppUpdatePolicy.Flow.IMMEDIATE, WRNAppUpdatePolicy.choose(false, 4, true, true));
        assertEquals(WRNAppUpdatePolicy.Flow.FLEXIBLE, WRNAppUpdatePolicy.choose(false, 5, true, false));
        assertEquals(WRNAppUpdatePolicy.Flow.NONE, WRNAppUpdatePolicy.choose(false, 3, false, true));
        assertEquals(WRNAppUpdatePolicy.Flow.NONE, WRNAppUpdatePolicy.choose(false, 5, false, false));
        assertEquals(WRNAppUpdatePolicy.Flow.IMMEDIATE, WRNAppUpdatePolicy.choose(true, 0, true, true));
        assertEquals(WRNAppUpdatePolicy.Flow.NONE, WRNAppUpdatePolicy.choose(true, 5, true, false));
    }

    @Test public void cooldownBoundaryAndClockRegressionAreProtected() {
        long prior = 1_000L;
        assertTrue(WRNAppUpdatePolicy.canPrompt(prior, 0L));
        assertFalse(WRNAppUpdatePolicy.canPrompt(0L, 0L));
        assertFalse(WRNAppUpdatePolicy.canPrompt(prior - 1L, prior));
        assertFalse(WRNAppUpdatePolicy.canPrompt(prior + WRNAppUpdatePolicy.COOLDOWN_MILLIS - 1L, prior));
        assertTrue(WRNAppUpdatePolicy.canPrompt(prior + WRNAppUpdatePolicy.COOLDOWN_MILLIS, prior));
    }
}
