// Get all necessary DOM elements
const playPauseButton = document.getElementById("play-pause-btn");
const fileInput = document.getElementById("file-input");
const playlist = document.getElementById("playlist");
const skipButton = document.getElementById("skip-btn");
const loopButton = document.getElementById("loop-btn");
const shuffleButton = document.getElementById("shuffle-btn");
const progressBar = document.getElementById("progress-bar");
const previousButton = document.getElementById("previous-btn");
const themeToggleButton = document.getElementById("mode-switcher");
const searchBar = document.getElementById("search-bar");
const muteButton = document.getElementById("mute-btn");

// Variables for song and player state
let audio = new Audio();
let isPlaying = false;
let currentSongIndex = 0;
let songs = [];
let isShuffleEnabled = false;
let isRepeatEnabled = false;

// Event listeners for controls
themeToggleButton.addEventListener("click", toggleTheme);
fileInput.addEventListener("change", handleFileSelection);
playPauseButton.addEventListener("click", togglePlayPause);
skipButton.addEventListener("click", skipSong);
previousButton.addEventListener("click", previousSong);
shuffleButton.addEventListener("click", toggleShuffle);
loopButton.addEventListener("click", toggleLoop);
progressBar.addEventListener("input", updateProgressBar);
audio.addEventListener("ended", handleSongEnd);
audio.addEventListener("loadedmetadata", updateDuration);
audio.addEventListener("timeupdate", updateCurrentTime);
searchBar.addEventListener("input", handleSearch);
muteButton.addEventListener("click", toggleMute);

// Dark/Light mode toggle functionality
function toggleTheme() {
    document.body.classList.toggle("dark-mode");
    document.body.classList.toggle("light-mode", !document.body.classList.contains("dark-mode"));
    const icon = themeToggleButton.querySelector("i");
    icon.classList.toggle("fa-sun");
    icon.classList.toggle("fa-moon");
}

// Handle song file selection and playlist display
function handleFileSelection(event) {
    const files = event.target.files;
    songs = [];
    playlist.innerHTML = ""; // Clear previous list

    Array.from(files).forEach((file, index) => {
        if (file.type.startsWith("audio/")) {
            const songPath = URL.createObjectURL(file);
            songs.push({ path: songPath, name: file.name.replace(/\.[^/.]+$/, "") });
            const songItem = createSongItem(index);
            playlist.appendChild(songItem);
        }
    });

    if (songs.length > 0) {
        currentSongIndex = 0;
        playSong();
    }
}

// Create and return a song item for the playlist
function createSongItem(index) {
    const songItem = document.createElement("li");
    songItem.textContent = songs[index].name;
    
    // Event listeners for play and remove
    songItem.addEventListener("click", () => {
        currentSongIndex = index;
        playSong();
    });

    songItem.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        removeSong(index, songItem);
    });

    return songItem;
}

// Remove song from playlist
function removeSong(index, songItem) {
    if (index < 0 || index >= songs.length) return;

    songs.splice(index, 1);
    songItem.remove();

    // Adjust currentSongIndex if needed
    if (index === currentSongIndex) {
        if (songs.length > 0) {
            currentSongIndex = currentSongIndex % songs.length;
            playSong();
        } else {
            resetPlayer();
        }
    } else if (index < currentSongIndex) {
        currentSongIndex--;
    }

    rebuildPlaylist();
}

// Rebuild the playlist UI
function rebuildPlaylist() {
    playlist.innerHTML = "";
    songs.forEach((song, index) => {
        const songItem = createSongItem(index);
        if (index === currentSongIndex) songItem.classList.add("playing");
        playlist.appendChild(songItem);
    });
}

// Reset the player when there are no songs left
function resetPlayer() {
    audio.pause();
    audio.src = "";
    playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
    currentSongIndex = 0;
    isPlaying = false;
}

// Modify playSong to handle play logic and UI
function playSong() {
    if (songs.length === 0) return resetPlayer();

    const currentSong = songs[currentSongIndex];
    audio.src = currentSong.path;
    currentPlayingItem = playlist.children[currentSongIndex];

    updatePlayingState();
    audio.load();
    audio.play().catch(error => console.error("Error while trying to play the song: ", error));

    playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
    isPlaying = true;
    updateDuration();
}

// Update playing state (visuals)
function updatePlayingState() {
    const songItems = document.querySelectorAll("#playlist li");
    songItems.forEach(songItem => songItem.classList.remove("playing"));

    if (currentPlayingItem) {
        currentPlayingItem.classList.add("playing");
    }
}

// Toggle play/pause
function togglePlayPause() {
    if (isPlaying) {
        audio.pause();
        playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        audio.play();
        playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
    }
    isPlaying = !isPlaying;
}

// Skip song functionality
function skipSong() {
    if (isShuffleEnabled) {
        currentSongIndex = Math.floor(Math.random() * songs.length);
    } else {
        currentSongIndex = (currentSongIndex + 1) % songs.length;
    }
    playSong();
}

// Go to the previous song
function previousSong() {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    playSong();
}

function toggleShuffle() {
    isShuffleEnabled = !isShuffleEnabled;
    shuffleButton.classList.toggle("active", isShuffleEnabled);

    // Only reset the shuffle-related settings, don't affect loop
    if (isShuffleEnabled) {
        isRepeatEnabled = false;
        loopButton.classList.remove("active");
        audio.loop = false; // Ensure loop is disabled when shuffle is enabled
    }
}

function toggleLoop() {
    isRepeatEnabled = !isRepeatEnabled;
    loopButton.classList.toggle("active", isRepeatEnabled);
    audio.loop = isRepeatEnabled;

    // Ensure shuffle is disabled if loop is enabled
    if (isRepeatEnabled) {
        isShuffleEnabled = false;
        shuffleButton.classList.remove("active");
    }
}



// Update the progress bar
function updateDuration() {
    document.getElementById("duration-time").textContent = formatTime(audio.duration);
}

function updateCurrentTime() {
    const currentTimeDisplay = document.getElementById("current-time");
    currentTimeDisplay.textContent = formatTime(audio.currentTime);
    progressBar.value = (audio.currentTime / audio.duration) * 100;
}

// Sync audio progress with the progress bar
function updateProgressBar() {
    const seekTime = (progressBar.value / 100) * audio.duration;
    audio.currentTime = seekTime;
}

// Handle the end of the song
function handleSongEnd() {
    if (isShuffleEnabled) {
        currentSongIndex = Math.floor(Math.random() * songs.length);
    } else if (isRepeatEnabled) {
        playSong();
        return;
    } else {
        currentSongIndex = (currentSongIndex + 1) % songs.length;
    }

    playSong();
}

// Format time (minutes:seconds)
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
}

// Search functionality
function handleSearch() {
    const query = searchBar.value.toLowerCase();
    const songItems = document.querySelectorAll("#playlist li");

    songItems.forEach(songItem => {
        const songName = songItem.textContent.toLowerCase();
        songItem.style.display = songName.includes(query) ? "block" : "none";
    });

    const noResultsMessage = document.getElementById("no-results-message");
    noResultsMessage.style.display = [...songItems].some(item => item.style.display === "block") ? "none" : "block";
}

// Mute button functionality
function toggleMute() {
    audio.muted = !audio.muted;
    muteButton.innerHTML = audio.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
}
