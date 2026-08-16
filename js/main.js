// Video Data Management
let videos = [];
let currentVideo = null;
let userLikes = new Set(JSON.parse(localStorage.getItem('userLikes') || '[]'));
let videoStats = JSON.parse(localStorage.getItem('videoStats') || '{}');

// Load Videos
async function loadVideos() {
    try {
        const response = await fetch('data/videos.json');
        const data = await response.json();
        videos = data.videos;
        
        // Initialize stats if not exists
        videos.forEach(video => {
            if (!videoStats[video.id]) {
                videoStats[video.id] = { views: 0, likes: 0 };
            }
        });
        
        displayVideos(videos);
    } catch (error) {
        console.error('Error loading videos:', error);
        // Fallback data
        videos = getFallbackVideos();
        displayVideos(videos);
    }
}

// Fallback Videos
function getFallbackVideos() {
    return [
        {
            id: 1,
            title: "Amazing Nature Documentary",
            description: "Beautiful nature footage with relaxing music.",
            embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            downloadUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
            category: "nature",
            duration: "10:25"
        },
        {
            id: 2,
            title: "Big Buck Bunny - Animation",
            description: "Classic animation short film about a big rabbit.",
            embedUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ",
            downloadUrl: "https://www.w3schools.com/html/movie.mp4",
            category: "animation",
            duration: "05:30"
        },
        {
            id: 3,
            title: "Music Video - Top Hits",
            description: "Latest music videos collection.",
            embedUrl: "https://www.youtube.com/embed/9bZkp7q19f0",
            downloadUrl: "https://example.com/music-video.mp4",
            category: "music",
            duration: "03:45"
        }
    ];
}

// Display Videos
function displayVideos(videoList) {
    const grid = document.getElementById('videoGrid');
    const noResults = document.getElementById('noResults');
    
    if (videoList.length === 0) {
        grid.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    grid.innerHTML = videoList.map(video => {
        const stats = videoStats[video.id] || { views: 0, likes: 0 };
        return `
            <div class="video-card" onclick="openVideo(${video.id})">
                <div class="video-thumbnail">
                    <iframe src="${video.embedUrl}" frameborder="0" allowfullscreen></iframe>
                    ${video.duration ? `<span class="video-duration">${video.duration}</span>` : ''}
                </div>
                <div class="video-card-content">
                    <h3>${video.title}</h3>
                    <div class="video-meta">
                        <span><i class="fas fa-eye"></i> ${formatCount(stats.views)} views</span>
                        <span><i class="fas fa-thumbs-up"></i> ${formatCount(stats.likes)} likes</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Format Numbers
function formatCount(count) {
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'K';
    }
    return count;
}

// Search Videos
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

// Open Video
function openVideo(videoId) {
    currentVideo = videos.find(v => v.id === videoId);
    
    if (!currentVideo) return;
    
    // Increment views
    if (!videoStats[currentVideo.id]) {
        videoStats[currentVideo.id] = { views: 0, likes: 0 };
    }
    videoStats[currentVideo.id].views++;
    localStorage.setItem('videoStats', JSON.stringify(videoStats));
    
    // Update modal
    document.getElementById('videoFrame').src = currentVideo.embedUrl;
    document.getElementById('videoTitle').textContent = currentVideo.title;
    document.getElementById('videoDescription').textContent = currentVideo.description;
    document.getElementById('viewCount').textContent = `${formatCount(videoStats[currentVideo.id].views)} views`;
    document.getElementById('likeCount').textContent = `${formatCount(videoStats[currentVideo.id].likes)} likes`;
    
    // Update like button state
    updateLikeButton();
    
    // Show modal
    document.getElementById('videoModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Refresh grid to show updated views
    displayVideos(videos);
}

// Close Modal
function closeModal() {
    document.getElementById('videoModal').style.display = 'none';
    document.getElementById('videoFrame').src = '';
    document.body.style.overflow = 'auto';
}

// Like Video (One like per user)
function likeVideo() {
    if (!currentVideo) return;
    
    const videoId = currentVideo.id;
    
    if (userLikes.has(videoId.toString())) {
        // Unlike
        userLikes.delete(videoId.toString());
        videoStats[videoId].likes--;
    } else {
        // Like
        userLikes.add(videoId.toString());
        videoStats[videoId].likes++;
    }
    
    // Save to localStorage
    localStorage.setItem('userLikes', JSON.stringify([...userLikes]));
    localStorage.setItem('videoStats', JSON.stringify(videoStats));
    
    // Update UI
    document.getElementById('likeCount').textContent = `${formatCount(videoStats[videoId].likes)} likes`;
    updateLikeButton();
    
    // Refresh grid
    displayVideos(videos);
}

// Update Like Button
function updateLikeButton() {
    if (!currentVideo) return;
    
    const likeBtn = document.getElementById('likeBtn');
    const isLiked = userLikes.has(currentVideo.id.toString());
    
    if (isLiked) {
        likeBtn.classList.add('liked');
        likeBtn.innerHTML = '<i class="fas fa-thumbs-up"></i><span>Liked</span>';
    } else {
        likeBtn.classList.remove('liked');
        likeBtn.innerHTML = '<i class="fas fa-thumbs-up"></i><span>Like</span>';
    }
}

// Share Video
function shareVideo() {
    if (!currentVideo) return;
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?video=${currentVideo.id}`;
    
    if (navigator.share) {
        navigator.share({
            title: currentVideo.title,
            text: currentVideo.description,
            url: shareUrl,
        }).catch(() => {
            copyToClipboard(shareUrl);
        });
    } else {
        copyToClipboard(shareUrl);
    }
}

// Copy to Clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Link copied to clipboard!');
    });
}

// Download Video
function downloadVideo() {
    if (!currentVideo || !currentVideo.downloadUrl) return;
    
    // Direct download
    window.open(currentVideo.downloadUrl, '_blank');
}

// Toggle Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('hidden');
    sidebar.classList.toggle('show');
}

// Filter Functions
function showAllVideos() {
    displayVideos(videos);
    setActiveSidebar('home');
}

function showTrending() {
    const trending = [...videos].sort((a, b) => {
        const statsA = videoStats[a.id] || { views: 0 };
        const statsB = videoStats[b.id] || { views: 0 };
        return statsB.views - statsA.views;
    });
    displayVideos(trending);
    setActiveSidebar('trending');
}

function showMostViewed() {
    const mostViewed = [...videos].sort((a, b) => {
        const statsA = videoStats[a.id] || { views: 0 };
        const statsB = videoStats[b.id] || { views: 0 };
        return statsB.views - statsA.views;
    });
    displayVideos(mostViewed);
    setActiveSidebar('viewed');
}

function showMostLiked() {
    const mostLiked = [...videos].sort((a, b) => {
        const statsA = videoStats[a.id] || { likes: 0 };
        const statsB = videoStats[b.id] || { likes: 0 };
        return statsB.likes - statsA.likes;
    });
    displayVideos(mostLiked);
    setActiveSidebar('liked');
}

// Set Active Sidebar
function setActiveSidebar(active) {
    const items = document.querySelectorAll('.sidebar-item');
    items.forEach(item => item.classList.remove('active'));
    
    const activeMap = {
        'home': 0,
        'trending': 1,
        'viewed': 2,
        'liked': 3
    };
    
    if (activeMap[active] !== undefined) {
        items[activeMap[active]].classList.add('active');
    }
}

// Close modal on outside click
window.onclick = function(event) {
    if (event.target === document.getElementById('videoModal')) {
        closeModal();
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// Load videos on page load
document.addEventListener('DOMContentLoaded', loadVideos);
