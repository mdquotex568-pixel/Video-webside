// Video Data Management
let videos = [];
let videoStats = JSON.parse(localStorage.getItem('videoStats') || '{}');

// Load Videos
async function loadVideos() {
    try {
        const response = await fetch('data/videos.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (!data.videos || !Array.isArray(data.videos)) throw new Error('Invalid videos.json structure');
        videos = data.videos;

        // Initialize stats if not exists (views/likes placeholder, optional)
        videos.forEach(video => {
            if (!videoStats[video.id]) {
                videoStats[video.id] = { views: 0, likes: 0 };
            }
        });

        displayVideos(videos);
    } catch (error) {
        console.error('Error loading videos.json:', error);
        videos = getFallbackVideos();
        displayVideos(videos);
    }
}

// Fallback videos (if JSON fails)
function getFallbackVideos() {
    return [
        {
            id: 1,
            title: "Sample Video 1",
            description: "This is a sample video",
            embedUrl: "https://example.com/video1",
            category: "general",
            thumbnailUrl: "https://via.placeholder.com/640x360.png?text=Video+1"
        },
        {
            id: 2,
            title: "Sample Video 2",
            description: "Another sample",
            embedUrl: "https://example.com/video2",
            category: "general"
        }
    ];
}

// Display Videos
function displayVideos(videoList) {
    const grid = document.getElementById('videoGrid');
    const noResults = document.getElementById('noResults');
    if (!grid) return;

    if (videoList.length === 0) {
        grid.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    noResults.style.display = 'none';

    grid.innerHTML = videoList.map(video => {
        const thumbSrc = getThumbnailSrc(video);
        return `
            <div class="video-card" onclick="openVideoLink(${video.id})">
                <div class="video-thumbnail">
                    <img src="${thumbSrc}" alt="${video.title}">
                    <div class="play-overlay"><i class="fas fa-play"></i></div>
                </div>
                <div class="video-card-content">
                    <h3>${video.title}</h3>
                </div>
            </div>
        `;
    }).join('');
}

// Get Thumbnail Source
function getThumbnailSrc(video) {
    if (video.thumbnailUrl && video.thumbnailUrl.trim() !== '') {
        return video.thumbnailUrl;
    }
    // Default placeholder
    return 'https://via.placeholder.com/640x360.png?text=No+Thumbnail';
}

// Open Video Link (new tab)
function openVideoLink(videoId) {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;
    window.open(video.embedUrl, '_blank');
}

// Search Videos
function searchVideos() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    if (searchTerm === '') {
        displayVideos(videos);
        return;
    }
    const filtered = videos.filter(v => 
        `${v.title} ${v.description || ''} ${v.category || ''}`.toLowerCase().includes(searchTerm)
    );
    displayVideos(filtered);
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
    // Since no actual view tracking in this simplified version, just sort by ID or random
    const trending = [...videos].sort((a, b) => b.id - a.id);
    displayVideos(trending);
    setActiveSidebar('trending');
}

function showMostViewed() {
    // Could be based on videoStats if you implement view counting
    const sorted = [...videos].sort((a, b) => (videoStats[b.id]?.views || 0) - (videoStats[a.id]?.views || 0));
    displayVideos(sorted);
    setActiveSidebar('viewed');
}

function showMostLiked() {
    const sorted = [...videos].sort((a, b) => (videoStats[b.id]?.likes || 0) - (videoStats[a.id]?.likes || 0));
    displayVideos(sorted);
    setActiveSidebar('liked');
}

// Set Active Sidebar
function setActiveSidebar(active) {
    const items = document.querySelectorAll('.sidebar-item');
    items.forEach(item => item.classList.remove('active'));
    const activeMap = { 'home': 0, 'trending': 1, 'viewed': 2, 'liked': 3 };
    if (activeMap[active] !== undefined) {
        items[activeMap[active]].classList.add('active');
    }
}

// Load videos on page load
document.addEventListener('DOMContentLoaded', loadVideos);
