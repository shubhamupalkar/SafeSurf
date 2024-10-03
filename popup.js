document.addEventListener('DOMContentLoaded', function () {
    const trackerInput = document.getElementById("trackerInput");
    const addTrackerBtn = document.getElementById("addTracker");
    const feedbackMessage = document.getElementById("feedbackMessage"); // Assuming you have a feedback message element

    addTrackerBtn.addEventListener("click", function () {
        const newTracker = trackerInput.value.trim();
        if (newTracker) {
            chrome.storage.sync.get("trackers", function (data) {
                const trackers = data.trackers || [];
                if (!trackers.includes(newTracker)) {
                    trackers.push(newTracker);
                    chrome.storage.sync.set({ trackers: trackers }, function () {
                        console.log("Tracker added: ", newTracker);
                        feedbackMessage.textContent = "Tracker added successfully!";
                        feedbackMessage.style.color = "green"; // Feedback message styling
                        trackerInput.value = ""; // Clear the input
                    });
                } else {
                    feedbackMessage.textContent = "Tracker already exists!";
                    feedbackMessage.style.color = "red";
                }
            });
        } else {
            feedbackMessage.textContent = "Please enter a valid tracker!";
            feedbackMessage.style.color = "orange";
        }
    });
});
