package com.world.revolution;

final class WRNAppUpdateSession {
    static final int SNAPSHOT_VERSION = 1;
    static final int INVALID_SNAPSHOT_VERSION = -1;
    private long epoch = 1L, foregroundEpoch, completionToken, generation, immediateEpoch = -1L;
    private boolean resumed, destroyed, checking, attemptOpen, failureRecorded, completionDeferred, invalidSnapshot;
    private int outstanding;
    void resume() { if (!destroyed) { resumed = true; checking = false; epoch++; foregroundEpoch++; } }
    void pause() { resumed = false; checking = false; completionToken = 0L; epoch++; }
    void destroy() { pause(); destroyed = true; outstanding = 0; }
    boolean canRender() { return resumed && !destroyed; }
    long beginCheck() { if (!canRender() || checking) return 0L; checking = true; return ++epoch; }
    boolean finishCheck(long token) { if (!canRender() || !checking || token != epoch) return false; checking = false; return true; }
    boolean claimOrdinaryFlow(boolean cooldownElapsed) {
        if (!canRender() || invalidSnapshot || !cooldownElapsed || outstanding != 0) return false;
        if (!attemptOpen) { attemptOpen = true; generation++; return true; }
        if (!failureRecorded || !cooldownElapsed) return false;
        generation++; failureRecorded = false; return true;
    }
    boolean claimImmediateResume() {
        if (!canRender() || immediateEpoch == foregroundEpoch) return false;
        immediateEpoch = foregroundEpoch;
        if (invalidSnapshot) {
            invalidSnapshot = false;
            attemptOpen = true;
            failureRecorded = false;
            generation++;
        } else if (!attemptOpen) { attemptOpen = true; generation++; }
        outstanding++; return true;
    }
    void acceptOrdinaryLaunch() { outstanding++; }
    boolean consumeFlowResult() { if (destroyed || outstanding == 0) return false; outstanding--; return true; }
    void abandonLaunch() { if (outstanding > 0) outstanding--; }
    boolean recordFailure() {
        if (destroyed || failureRecorded) return false;
        if (!attemptOpen) { attemptOpen = true; generation++; }
        failureRecorded = true;
        return true;
    }
    long claimCompletionPrompt() { if (!canRender() || completionDeferred || completionToken != 0L) return 0L; completionToken = epoch; return completionToken; }
    boolean finishCompletionPrompt(long token) { if (!canRender() || token == 0L || token != epoch || token != completionToken) return false; completionToken = 0L; completionDeferred = true; return true; }
    long generation() { return generation; }
    int outstanding() { return outstanding; }
    int snapshotVersion() { return invalidSnapshot ? INVALID_SNAPSHOT_VERSION : SNAPSHOT_VERSION; }
    boolean restore(int version, long savedGeneration, boolean savedOpen, boolean savedFailure, int savedOutstanding) {
        if (version != SNAPSHOT_VERSION || savedGeneration < 0L || savedOutstanding < 0
            || (!savedOpen && (savedFailure || savedOutstanding != 0))
            || (savedGeneration == 0L && savedOpen)) {
            invalidSnapshot = true;
            return false;
        }
        generation = savedGeneration;
        attemptOpen = savedOpen;
        failureRecorded = savedFailure;
        outstanding = savedOutstanding;
        invalidSnapshot = false;
        return true;
    }
    boolean attemptOpen() { return attemptOpen; }
    boolean failureRecorded() { return failureRecorded; }
}
