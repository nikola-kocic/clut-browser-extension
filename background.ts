const mru: number[] = [];
let slowSwitchOngoing = false;
let fastSwitchOngoing = false;
let intSwitchCount = 0;
let lastIntSwitchIndex = 0;

let prevTimestamp = 0;
let slowtimerValue = 1500;
let fasttimerValue = 200;
let timer: number;

let slowswitchForward = false;

let initialized = false;

let loggingOn = false;

const CLUTlog = function(str: string) {
    if (loggingOn) {
        console.log(str);
    }
};

const processCommand = function(command: string) {
    CLUTlog("Command recd:" + command);
    let fastswitch = true;
    slowswitchForward = false;
    if (command === "alt_switch_fast") {
        fastswitch = true;
    } else if (command === "alt_switch_slow_backward") {
        fastswitch = false;
        slowswitchForward = false;
    } else if (command === "alt_switch_slow_forward") {
        fastswitch = false;
        slowswitchForward = true;
    }

    if (!slowSwitchOngoing && !fastSwitchOngoing) {

        if (fastswitch) {
            fastSwitchOngoing = true;
        } else {
            slowSwitchOngoing = true;
        }
        CLUTlog("CLUT::START_SWITCH");
        intSwitchCount = 0;
        doIntSwitch();

    } else if ((slowSwitchOngoing && !fastswitch) || (fastSwitchOngoing && fastswitch)) {
        CLUTlog("CLUT::DO_INT_SWITCH");
        doIntSwitch();

    } else if (slowSwitchOngoing && fastswitch) {
        endSwitch();
        fastSwitchOngoing = true;
        CLUTlog("CLUT::START_SWITCH");
        intSwitchCount = 0;
        doIntSwitch();

    } else if (fastSwitchOngoing && !fastswitch) {
        endSwitch();
        slowSwitchOngoing = true;
        CLUTlog("CLUT::START_SWITCH");
        intSwitchCount = 0;
        doIntSwitch();
    }

    if (timer) {
        if (fastSwitchOngoing || slowSwitchOngoing) {
            clearTimeout(timer);
        }
    }
    if (fastswitch) {
        timer = setTimeout(function() { endSwitch(); }, fasttimerValue);
    } else {
        timer = setTimeout(function() { endSwitch(); }, slowtimerValue);
    }

};

chrome.commands.onCommand.addListener(processCommand);

chrome.browserAction.onClicked.addListener(function(tab) {
    CLUTlog("Click recd");
    processCommand("alt_switch_fast");

});

chrome.runtime.onStartup.addListener(function() {
    CLUTlog("on startup");
    initialize();

});

chrome.runtime.onInstalled.addListener(function() {
    CLUTlog("on startup");
    initialize();

});

const doIntSwitch = function() {
    CLUTlog("CLUT:: in int switch, intSwitchCount: " + intSwitchCount + ", mru.length: " + mru.length);
    if (intSwitchCount < mru.length && intSwitchCount >= 0) {
        // check if tab is still present
        // sometimes tabs have gone missing
        let invalidTab = true;
        if (slowswitchForward) {
            decrementSwitchCounter();
        } else {
            incrementSwitchCounter();
        }
        const tabIdToMakeActive = mru[intSwitchCount];
        chrome.tabs.get(tabIdToMakeActive, function(tab) {
            if (tab) {
                const thisWindowId = tab.windowId;
                invalidTab = false;

                chrome.windows.update(thisWindowId, { focused: true });
                chrome.tabs.update(tabIdToMakeActive, {
                    active: true,
                    // highlighted: true,
                });
                lastIntSwitchIndex = intSwitchCount;
                // break;
            } else {
                CLUTlog("CLUT:: in int switch, >>invalid tab found.intSwitchCount: " + intSwitchCount
                    + ", mru.length: " + mru.length);
                removeItemAtIndexFromMRU(intSwitchCount);
                if (intSwitchCount >= mru.length) {
                    intSwitchCount = 0;
                }
                doIntSwitch();
            }
        });
    }
};

const endSwitch = function() {
    CLUTlog("CLUT::END_SWITCH");
    slowSwitchOngoing = false;
    fastSwitchOngoing = false;
    const tabId = mru[lastIntSwitchIndex];
    putExistingTabToTop(tabId);
    printMRUSimple();
};

chrome.tabs.onActivated.addListener(function(activeInfo) {
    if (!slowSwitchOngoing && !fastSwitchOngoing) {
        const index = mru.indexOf(activeInfo.tabId);

        // probably should not happen since tab created gets called first than activated for new tabs,
        // but added as a backup behavior to avoid orphan tabs
        if (index === -1) {
            CLUTlog("Unexpected scenario hit with tab(" + activeInfo.tabId + ").");
            addTabToMRUAtFront(activeInfo.tabId);
        } else {
            putExistingTabToTop(activeInfo.tabId);
        }
    }
});

chrome.tabs.onCreated.addListener(function(tab) {
    CLUTlog("Tab create event fired with tab(" + tab.id + ")");
    if (tab.id !== undefined) {
        addTabToMRUAtBack(tab.id);
    }
});

chrome.tabs.onRemoved.addListener(function(tabId, removedInfo) {
    CLUTlog("Tab remove event fired from tab(" + tabId + ")");
    removeTabFromMRU(tabId);
});

const addTabToMRUAtBack = function(tabId: number) {
    const index = mru.indexOf(tabId);
    if (index === -1) {
        // add to the end of mru
        mru.splice(-1, 0, tabId);
    }

};

const addTabToMRUAtFront = function(tabId: number) {
    const index = mru.indexOf(tabId);
    if (index === -1) {
        // add to the front of mru
        mru.splice(0, 0, tabId);
    }
};

const putExistingTabToTop = function(tabId: number) {
    const index = mru.indexOf(tabId);
    if (index !== -1) {
        mru.splice(index, 1);
        mru.unshift(tabId);
    }
};

const removeTabFromMRU = function(tabId: number) {
    const index = mru.indexOf(tabId);
    if (index !== -1) {
        mru.splice(index, 1);
    }
};

const removeItemAtIndexFromMRU = function(index: number) {
    if (index < mru.length) {
        mru.splice(index, 1);
    }
};

const incrementSwitchCounter = function() {
    intSwitchCount = (intSwitchCount + 1) % mru.length;
};

const decrementSwitchCounter = function() {
    if (intSwitchCount === 0) {
        intSwitchCount = mru.length - 1;
    } else {
        intSwitchCount = intSwitchCount - 1;
    }
};

const initialize = function() {
    if (!initialized) {
        initialized = true;
        chrome.windows.getAll({ populate: true }, function(windows) {
            windows.forEach(function(window) {
                const tabs = window.tabs;
                if (tabs !== undefined) {
                    tabs.forEach(function(tab) {
                        if (tab.id !== undefined) {
                            mru.unshift(tab.id);
                        }
                    });
                }
            });
            CLUTlog("MRU after init: " + mru);
        });
    }
};

const printMRUSimple = function() {
    CLUTlog("mru: " + mru);
};

initialize();
