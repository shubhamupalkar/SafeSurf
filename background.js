let knownTrackers = [];
const MAX_TOTAL_RULES = 5000; // Total rule limit for Chrome (static + dynamic)
const STATIC_RULES_COUNT = 1000; // Limit static rules to 1000
const CHUNK_SIZE = 500;  // Number of rules processed at a time

// Function to load the tracker list from a file
function loadTrackers() {
    fetch(chrome.runtime.getURL("data/trackers.txt"))
        .then(response => response.text())
        .then(text => {
            // Split by lines and clean the data
            knownTrackers = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
            console.log("Trackers loaded: ", knownTrackers);
            setupBlockingRules();  // Set up dynamic rules after trackers load
        })
        .catch(error => console.error("Error loading tracker list: ", error));
}

// Function to load static rules from rules.json
function loadStaticRules() {
    fetch(chrome.runtime.getURL("rules.json"))
        .then(response => response.json())
        .then(rules => {
            // Limit static rules to a predefined number to avoid exceeding the total limit
            const staticRules = rules.slice(0, STATIC_RULES_COUNT).map((rule, index) => ({
                ...rule,
                id: rule.id || (1000 + index) // Assign unique IDs starting from 1000
            }));

            // Update static rules
            chrome.declarativeNetRequest.updateDynamicRules({
                addRules: staticRules,
                removeRuleIds: staticRules.map(rule => rule.id)
            }).then(() => {
                console.log(`Static rules loaded successfully (limit: ${STATIC_RULES_COUNT}).`);
            }).catch(error => {
                console.error("Error updating static rules: ", error);
            });
        })
        .catch(error => console.error("Error loading static rules from rules.json: ", error));
}

// Function to set up dynamic blocking rules, considering total rule limits
function setupBlockingRules() {
    const prioritizedTrackers = prioritizeTrackers(knownTrackers); // Prioritize trackers

    // Calculate how many dynamic rules can be loaded after accounting for static rules
    const availableDynamicRuleSlots = MAX_TOTAL_RULES - STATIC_RULES_COUNT;
    const allowedDynamicRules = Math.min(availableDynamicRuleSlots, prioritizedTrackers.length);

    // Load the rules in chunks
    for (let i = 0; i < allowedDynamicRules; i += CHUNK_SIZE) {
        const trackerChunk = prioritizedTrackers.slice(i, i + CHUNK_SIZE);

        // Create dynamic rules for each chunk
        const dynamicRules = trackerChunk.map((tracker, index) => ({
            id: i + index + 10000,  // Assign unique IDs for dynamic rules
            priority: 3,
            action: { type: 'block' },
            condition: {
                urlFilter: `*://${tracker}/*`,
                resourceTypes: ['main_frame', 'sub_frame', 'script', 'image', 'xmlhttprequest']
            }
        }));

        // Add the dynamic rules
        chrome.declarativeNetRequest.updateDynamicRules({
            addRules: dynamicRules,
            removeRuleIds: dynamicRules.map(rule => rule.id)
        }).then(() => {
            console.log(`Dynamic rules chunk loaded successfully (start: ${i + 1}, size: ${CHUNK_SIZE}).`);
        }).catch(error => {
            console.error("Error updating dynamic rules: ", error);
        });
    }
}

// Function to prioritize trackers (optional example logic)
function prioritizeTrackers(trackers) {
    // Example logic: prioritize trackers containing "ads" or "track"
    return trackers.filter(tracker => tracker.includes("ads") || tracker.includes("track"));
}

// Call the function to load trackers when the service worker starts
chrome.runtime.onInstalled.addListener(() => {
    console.log("SafeSurf installed!");
    loadStaticRules();  // Load static rules on installation
    loadTrackers();     // Load dynamic tracker-based rules on installation
});

// Load trackers when the service worker starts
loadTrackers();
