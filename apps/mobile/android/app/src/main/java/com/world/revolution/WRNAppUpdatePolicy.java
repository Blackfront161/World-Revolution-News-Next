package com.world.revolution;

final class WRNAppUpdatePolicy {
    enum Flow { NONE, FLEXIBLE, IMMEDIATE }
    static final int CRITICAL_PRIORITY = 4;
    static final long COOLDOWN_MILLIS = 24L * 60L * 60L * 1000L;
    static final long CHECK_TIMEOUT_MILLIS = 5_000L;

    private WRNAppUpdatePolicy() {}

    static Flow choose(boolean immediateInProgress, int priority, boolean flexibleAllowed, boolean immediateAllowed) {
        if (immediateInProgress) return immediateAllowed ? Flow.IMMEDIATE : Flow.NONE;
        if (priority >= CRITICAL_PRIORITY && immediateAllowed) return Flow.IMMEDIATE;
        return flexibleAllowed ? Flow.FLEXIBLE : Flow.NONE;
    }

    static boolean canPrompt(long now, long lastDeclinedOrFailedAt) {
        if (now <= 0L) return false;
        if (lastDeclinedOrFailedAt <= 0L) return true;
        return now >= lastDeclinedOrFailedAt && now - lastDeclinedOrFailedAt >= COOLDOWN_MILLIS;
    }
}
