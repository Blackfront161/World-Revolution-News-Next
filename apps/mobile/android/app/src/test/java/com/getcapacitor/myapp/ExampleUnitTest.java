package com.world.revolution;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

/**
 * Guards the native identity that must remain compatible with the current app.
 */
public class ExampleUnitTest {

    @Test
    public void packageAndVersionMatchThePreparedUpdate() {
        assertEquals("com.world.revolution", BuildConfig.APPLICATION_ID);
        assertEquals(27, BuildConfig.VERSION_CODE);
        assertEquals("2.2.0", BuildConfig.VERSION_NAME);
    }
}
