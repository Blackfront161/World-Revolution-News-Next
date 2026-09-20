package com.world.revolution;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import androidx.test.ext.junit.runners.AndroidJUnit4;

import org.junit.Test;
import org.junit.runner.RunWith;

/** Prepared for an Android runner; no device execution is claimed by this slice. */
@RunWith(AndroidJUnit4.class)
public class WRNPlatformInstrumentedTest {
    @Test
    public void appliesTheSameAllowlistInTheAndroidTestArtifact() {
        WRNPlatformPolicy policy = new WRNPlatformPolicy();
        assertEquals("help", policy.parseDeepLink("com.world.revolution://open/help"));
        assertNull(policy.parseDeepLink("com.world.revolution://open/help#fragment"));
    }
}
