package com.world.revolution;

import static org.junit.Assert.*;
import org.junit.Test;

public class WRNAppUpdateSessionTest {
    @Test public void immediateResumeIsOncePerForegroundEpochAndCountsResults() {
        WRNAppUpdateSession s = new WRNAppUpdateSession(); s.resume();
        assertTrue(s.claimImmediateResume()); assertFalse(s.claimImmediateResume());
        long check = s.beginCheck(); assertTrue(check > 0L); assertTrue(s.finishCheck(check)); assertFalse(s.claimImmediateResume());
        s.pause(); s.resume(); assertTrue(s.claimImmediateResume());
        assertEquals(2, s.outstanding()); assertTrue(s.consumeFlowResult()); assertTrue(s.recordFailure());
        assertTrue(s.consumeFlowResult()); assertFalse(s.recordFailure());
        assertFalse(s.consumeFlowResult());
    }

    @Test public void cooldownNeedsEveryOldResultThenPermitsExactlyOneNewGeneration() {
        WRNAppUpdateSession s = new WRNAppUpdateSession(); s.resume();
        long failureAt = 1_000L;
        assertFalse(s.claimOrdinaryFlow(false)); assertTrue(s.claimOrdinaryFlow(true)); s.acceptOrdinaryLaunch(); s.acceptOrdinaryLaunch(); assertTrue(s.recordFailure());
        assertFalse(WRNAppUpdatePolicy.canPrompt(failureAt + WRNAppUpdatePolicy.COOLDOWN_MILLIS - 1L, failureAt));
        assertFalse(s.claimOrdinaryFlow(false));
        assertTrue(WRNAppUpdatePolicy.canPrompt(failureAt + WRNAppUpdatePolicy.COOLDOWN_MILLIS, failureAt));
        assertFalse(s.claimOrdinaryFlow(true)); assertTrue(s.consumeFlowResult()); assertFalse(s.claimOrdinaryFlow(true));
        assertTrue(s.consumeFlowResult()); assertTrue(s.claimOrdinaryFlow(true)); assertFalse(s.claimOrdinaryFlow(true));
        assertEquals(2L, s.generation());
    }

    @Test public void restoreKeepsOldResultsAndInvalidSnapshotFailsClosed() {
        WRNAppUpdateSession s = new WRNAppUpdateSession(); s.resume(); assertTrue(s.claimOrdinaryFlow(true)); s.acceptOrdinaryLaunch(); assertTrue(s.recordFailure());
        WRNAppUpdateSession restored = new WRNAppUpdateSession(); assertTrue(restored.restore(WRNAppUpdateSession.SNAPSHOT_VERSION, s.generation(), s.attemptOpen(), s.failureRecorded(), s.outstanding())); restored.resume();
        assertFalse(restored.claimOrdinaryFlow(true)); assertTrue(restored.consumeFlowResult()); assertTrue(restored.claimOrdinaryFlow(true));
        WRNAppUpdateSession invalid = new WRNAppUpdateSession(); assertFalse(invalid.restore(0, -1L, false, false, -1)); invalid.resume(); assertFalse(invalid.claimOrdinaryFlow(true));
        WRNAppUpdateSession restoredInvalid = new WRNAppUpdateSession(); assertFalse(restoredInvalid.restore(invalid.snapshotVersion(), invalid.generation(), invalid.attemptOpen(), invalid.failureRecorded(), invalid.outstanding())); restoredInvalid.resume(); assertFalse(restoredInvalid.claimOrdinaryFlow(true)); assertTrue(restoredInvalid.claimImmediateResume());
    }
    @Test public void pausedAndSupersededRepliesCannotLaunchUi() {
        WRNAppUpdateSession s = new WRNAppUpdateSession();
        assertEquals(0L, s.beginCheck());
        s.resume();
        long old = s.beginCheck();
        assertEquals(0L, s.beginCheck());
        s.pause();
        assertFalse(s.finishCheck(old));
        assertFalse(s.claimOrdinaryFlow(true));
        assertEquals(0L, s.claimCompletionPrompt());
        s.resume();
        long current = s.beginCheck();
        assertFalse(s.finishCheck(old));
        assertTrue(s.finishCheck(current));
        assertFalse(s.finishCheck(current));
    }

    @Test public void timeoutIsFinalAndRepeatedFailuresDoNotExtendCooldown() {
        WRNAppUpdateSession s = new WRNAppUpdateSession();
        s.resume();
        long timedOut = s.beginCheck();
        assertTrue(s.finishCheck(timedOut));
        assertTrue(s.recordFailure());
        assertFalse(s.finishCheck(timedOut));
        assertFalse(s.recordFailure());
        s.pause(); s.resume();
        assertFalse(s.claimOrdinaryFlow(false));
        assertTrue(s.claimOrdinaryFlow(true));
        assertTrue(s.recordFailure());
        assertFalse(s.recordFailure());
    }

    @Test public void onlyOneActualPlayResultIsConsumedEvenAcrossPause() {
        WRNAppUpdateSession s = new WRNAppUpdateSession();
        s.resume();
        assertTrue(s.claimOrdinaryFlow(true)); s.acceptOrdinaryLaunch();
        assertFalse(s.claimOrdinaryFlow(true));
        s.pause();
        assertTrue(s.consumeFlowResult());
        assertFalse(s.consumeFlowResult());
        s.resume();
        assertFalse(s.claimOrdinaryFlow(true));
    }

    @Test public void restartAndDeferCallbacksMustBelongToTheVisiblePrompt() {
        WRNAppUpdateSession s = new WRNAppUpdateSession();
        s.resume();
        long old = s.claimCompletionPrompt();
        assertTrue(old > 0L);
        assertEquals(0L, s.claimCompletionPrompt());
        s.pause();
        assertFalse(s.finishCompletionPrompt(old));
        s.resume();
        long current = s.claimCompletionPrompt();
        assertFalse(s.finishCompletionPrompt(old));
        assertTrue(s.finishCompletionPrompt(current));
        assertFalse(s.finishCompletionPrompt(current));
        assertEquals(0L, s.claimCompletionPrompt());
    }

    @Test public void destroyedControllerHasNoRemainingCapabilities() {
        WRNAppUpdateSession s = new WRNAppUpdateSession();
        s.resume();
        long check = s.beginCheck();
        assertTrue(s.claimOrdinaryFlow(true)); s.acceptOrdinaryLaunch();
        long prompt = s.claimCompletionPrompt();
        s.destroy();
        s.resume();
        assertFalse(s.canRender());
        assertFalse(s.finishCheck(check));
        assertFalse(s.finishCompletionPrompt(prompt));
        assertFalse(s.consumeFlowResult());
        assertFalse(s.recordFailure());
        assertEquals(0L, s.beginCheck());
    }
}
