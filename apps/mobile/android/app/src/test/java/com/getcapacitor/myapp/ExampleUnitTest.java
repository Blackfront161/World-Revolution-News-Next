package com.world.revolution;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

/**
 * Guards the native identity that must remain compatible with the current app.
 */
public class ExampleUnitTest {

    @Test
    public void packageAndVersionMatchTheBoundBaseline() {
        assertEquals("com.world.revolution", BuildConfig.APPLICATION_ID);
        assertEquals(26, BuildConfig.VERSION_CODE);
        assertEquals("2.1.1", BuildConfig.VERSION_NAME);
    }
}
