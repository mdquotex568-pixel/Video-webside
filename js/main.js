// Video data
let videos = [];
let currentVideo = null;
let likes = {};

// Load videos from JSON
async function loadVideos() {
    try {
        const response = await fetch('data/videos.json');
        const data = await response.json();
        videos = data.videos;
        
        // Load likes from localStorage
        likes = JSON.parse(localStorage.getItem('videoLikes')) || {};
        
        displayVideos(videos);
    } catch (error) {
        console.error('Error loading videos:', error);
        // Fallback videos if JSON fails
        videos = [
            {
                id: 1,
                title: "Sample Video 1",
                description: "This is a sample video description",
                embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                downloadUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
                category: "music"
            },
            {
                id: 2,
                title: "Big Buck Bunny",
                description: "Animation short film",
                embedUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ",
                downloadUrl: "https://www.w3schools.com/html/movie.mp4",
                category: "animation"
            }
        ];
        displayVideos(videos);
    }
}

// Display videos in grid
function displayVideos(videoList) {
    const grid = document.getElementById('videoGrid');
    const noResults = document.getElementById('noResults');
    
    if (videoList.length === 0) {
        grid.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    grid.innerHTML = videoList.map(video => `
        <div class="video-card" onclick="openVideo(${video.id})">
            <div class="video-thumbnail">
                <iframe src="${video.embedUrl}" frameborder="0" allowfullscreen></iframe>
                <div class="play-icon">▶️</div>
            </div>
            <div class="video-card-content">
                <h3>${video.title}</h3>
                <p>${video.description.substring(0, 100)}...</p>
            </div>
        </div>
    `).join('');
}

// Search functionality
function searchVideos() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (searchTerm === '') {
        displayVideos(videos);
        return;
    }
    
    const filteredVideos = videos.filter(video => {
        const searchableText = `${video.title} ${video.description} ${video.category}`.toLowerCase();
        return searchableText.includes(searchTerm);
    });
    
    displayVideos(filteredVideos);
}

// Open video in modal
function openVideo(videoId) {
    currentVideo = videos.find(v => v.id === videoId);
    
    if (!currentVideo) return;
    
    document.getElementById('videoFrame').src = currentVideo.embedUrl;
    document.getElementById('videoTitle').textContent = currentVideo.title;
    document.getElementById('videoDescription').textContent = currentVideo.description;
    document.getElementById('likeCount').textContent = likes[videoId] || 0;
    
    document.getElementById('videoModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    document.getElementById('videoModal').style.display = 'none';
    document.getElementById('videoFrame').src = '';
    document.body.style.overflow = 'auto';
}

// Like functionality
function likeVideo() {
    if (!currentVideo) return;
    
    if (!likes[currentVideo.id]) {
        likes[currentVideo.id] = 0;
    }
    
    likes[currentVideo.id]++;
    document.getElementById('likeCount').textContent = likes[currentVideo.id];
    
    // Save to localStorage
    localStorage.setItem('videoLikes', JSON.stringify(likes));
}

// Share functionality
function shareVideo() {
    if (!currentVideo) return;
    
    const shareUrl = `${window.location.href}?video=${currentVideo.id}`;
    
    if (navigator.share) {
        navigator.share({
            title: currentVideo.title,
            text: currentVideo.description,
            url: shareUrl,
        }).catch(console.error);
    } else {
        // Fallback for browsers that don't support Web Share API
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('লিংক কপি করা হয়েছে! 📋');
        });
    }
}

// Download functionality
function downloadVideo() {
    if (!currentVideo) return;
    
    // Create download link
    const link = document.createElement('a');
    link.href = currentVideo.downloadUrl;
    link.download = `${currentVideo.title}.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Close modal on outside click
window.onclick = function(event) {
    if (event.target === document.getElementById('videoModal')) {
        closeModal();
    }
}

// Load videos on page load
document.addEventListener('DOMContentLoaded', loadVideos);
