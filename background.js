let knownTrackers = [];

// Function to load the tracker list from a file
function loadTrackers() {
    fetch(chrome.runtime.getURL("data/trackers.txt"))
        .then(response => response.text())
        .then(text => {
            // Split by lines and clean the data
            knownTrackers = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
            console.log("Trackers loaded: ", knownTrackers);
            setupBlockingRules();
        })
        .catch(error => console.error("Error loading tracker list: ", error));
}

// Load static rules from rules.json
function loadStaticRules() {
    fetch(chrome.runtime.getURL("rules.json"))
        .then(response => response.json())
        .then(rules => {
            // Update dynamic rules with the loaded static rules
            chrome.declarativeNetRequest.updateDynamicRules({
                addRules: rules,
                removeRuleIds: rules.map(rule => rule.id) // Remove any previous rules with the same IDs
            }).then(() => {
                console.log("Static rules loaded and updated successfully.");
            }).catch(error => {
                console.error("Error updating static rules: ", error);
            });
        })
        .catch(error => console.error("Error loading rules from rules.json: ", error));
}

// Set up blocking rules for the known trackers
function setupBlockingRules() {
    const rules = knownTrackers.map((tracker, index) => ({
        id: index + 3,  // Start IDs after static rules
        priority: 3,    // Priority of the rule
        action: { type: 'block' }, // Action to block the request
        condition: {
            urlFilter: `*://${tracker}/*`,  // URL pattern to match
            resourceTypes: ['main_frame', 'sub_frame', 'script', 'image', 'xmlhttprequest'] // Types of resources to block
        }
    }));

    // Remove old rules using their corresponding IDs
    const removeRuleIds = knownTrackers.map((_, index) => index + 3);

    // Update the dynamic rules in the declarativeNetRequest API
    chrome.declarativeNetRequest.updateDynamicRules({
        addRules: rules,
        removeRuleIds: removeRuleIds // Use integer IDs for removing rules
    }).then(() => {
        console.log("Dynamic blocking rules updated successfully.");
    }).catch(error => {
        console.error("Error updating dynamic blocking rules: ", error);
    });
}

// Call the function to load trackers when the service worker starts
chrome.runtime.onInstalled.addListener(() => {
    console.log("SafeSurf has been installed!");
    loadStaticRules();  // Load static rules on installation
    loadTrackers();  // Load trackers on installation
});

// Load trackers when the service worker starts
loadTrackers();
