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
        videos = getFallbackVideos();
        videos.forEach(video => {
            if (!videoStats[video.id]) {
                videoStats[video.id] = { views: 0, likes: 0 };
            }
        });
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
            embedUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // regular watch URL
            category: "nature"
        },
        {
            id: 2,
            title: "Big Buck Bunny - Animation",
            description: "Classic animation short film about a big rabbit.",
            embedUrl: "https://vimeo.com/1084537", // Vimeo normal URL
            category: "animation"
        },
        {
            id: 3,
            title: "Music Video - Top Hits",
            description: "Latest music videos collection.",
            embedUrl: "https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view", // Google Drive share link
            category: "music"
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
        const thumbnail = getThumbnailUrl(video);
        return `
            <div class="video-card" onclick="openVideo(${video.id})">
                <div class="video-thumbnail">
                    ${thumbnail ? `<img src="${thumbnail}" alt="${video.title}">` : getEmbedThumbnail(video.embedUrl)}
                    <div class="play-overlay">
                        <i class="fas fa-play"></i>
                    </div>
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

// Get Thumbnail URL (if provided)
function getThumbnailUrl(video) {
    if (video.thumbnailUrl) return video.thumbnailUrl;
    
    // Auto-detect thumbnail from URL
    const embedUrl = video.embedUrl;
    if (embedUrl.includes('<iframe')) {
        // Extract src from iframe code
        const srcMatch = embedUrl.match(/src=["']([^"']+)["']/);
        if (srcMatch) embedUrl = srcMatch[1];
    }
    
    // YouTube
    if (embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be')) {
        const videoId = extractYouTubeId(embedUrl);
        if (videoId) {
            return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
    }
    
    // Vimeo (thumbnail extraction not trivial, skip)
    // Others: no auto thumbnail
    return null;
}

// Get Embed Thumbnail (fallback: use iframe/video as thumbnail)
function getEmbedThumbnail(embedUrl) {
    const processedUrl = processVideoUrl(embedUrl);
    if (isDirectVideoUrl(processedUrl)) {
        return `<video src="${processedUrl}" muted></video>`;
    } else {
        return `<iframe src="${processedUrl}" frameborder="0" allowfullscreen></iframe>`;
    }
}

// Format Numbers
function formatCount(count) {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
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
function openVideo(videoId, pushState = true) {
    currentVideo = videos.find(v => v.id === videoId);
    if (!currentVideo) return;
    
    // Increment views
    if (!videoStats[currentVideo.id]) {
        videoStats[currentVideo.id] = { views: 0, likes: 0 };
    }
    videoStats[currentVideo.id].views++;
    localStorage.setItem('videoStats', JSON.stringify(videoStats));
    
    // Update modal
    updateVideoPlayer(currentVideo);
    document.getElementById('videoTitle').textContent = currentVideo.title;
    document.getElementById('videoDescription').textContent = currentVideo.description;
    document.getElementById('viewCount').textContent = `${formatCount(videoStats[currentVideo.id].views)} views`;
    document.getElementById('likeCount').textContent = `${formatCount(videoStats[currentVideo.id].likes)} likes`;
    
    updateLikeButton();
    showRelatedVideos(currentVideo);
    
    document.getElementById('videoModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    if (pushState) {
        history.pushState({ videoId: videoId }, '', `?video=${videoId}`);
    }
    
    displayVideos(videos);
}

// Update Video Player (handles any URL/iframe code)
function updateVideoPlayer(video) {
    const container = document.getElementById('videoPlayerContainer');
    const rawInput = video.embedUrl;
    const embedUrl = processVideoUrl(rawInput);
    
    if (isDirectVideoUrl(embedUrl)) {
        container.innerHTML = `<video controls autoplay src="${embedUrl}"></video>`;
    } else {
        container.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;
    }
}

// Process any video URL/iframe code and return embeddable URL
function processVideoUrl(input) {
    // If input contains iframe code, extract src
    if (input.includes('<iframe')) {
        const srcMatch = input.match(/src=["']([^"']+)["']/);
        if (srcMatch) input = srcMatch[1];
    }
    
    // Trim whitespace
    input = input.trim();
    
    // YouTube
    if (input.includes('youtube.com') || input.includes('youtu.be')) {
        const videoId = extractYouTubeId(input);
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
        }
    }
    
    // Vimeo
    if (input.includes('vimeo.com')) {
        const videoId = extractVimeoId(input);
        if (videoId) {
            return `https://player.vimeo.com/video/${videoId}`;
        }
    }
    
    // Dailymotion
    if (input.includes('dailymotion.com')) {
        const videoId = extractDailymotionId(input);
        if (videoId) {
            return `https://www.dailymotion.com/embed/video/${videoId}`;
        }
    }
    
    // Google Drive
    if (input.includes('drive.google.com')) {
        const fileId = extractGoogleDriveId(input);
        if (fileId) {
            return `https://drive.google.com/file/d/${fileId}/preview`;
        }
    }
    
    // Direct video file or other embed URL (return as-is)
    return input;
}

// Check if URL is direct video file
function isDirectVideoUrl(url) {
    return url.match(/\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i);
}

// Check if URL is Google Drive
function isGoogleDriveUrl(url) {
    return url.includes('drive.google.com');
}

// Extract Google Drive file ID
function extractGoogleDriveId(url) {
    const match = url.match(/\/file\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/) || url.match(/\/open\?id=([^&]+)/);
    return match ? match[1] : null;
}

// Extract YouTube Video ID from various formats
function extractYouTubeId(url) {
    const patterns = [
        /youtube\.com\/embed\/([^/?]+)/,
        /youtube\.com\/watch\?v=([^&]+)/,
        /youtu\.be\/([^/?]+)/,
        /youtube\.com\/shorts\/([^/?]+)/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Extract Vimeo ID
function extractVimeoId(url) {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
}

// Extract Dailymotion ID
function extractDailymotionId(url) {
    const match = url.match(/dailymotion\.com\/video\/([^_?]+)/);
    return match ? match[1] : null;
}

// Show Related Videos
function showRelatedVideos(currentVideo) {
    const relatedContainer = document.getElementById('relatedVideos');
    const related = videos.filter(v => v.id !== currentVideo.id && v.category === currentVideo.category);
    
    if (related.length === 0) {
        relatedContainer.innerHTML = '<p>No related videos found.</p>';
        return;
    }
    
    relatedContainer.innerHTML = related.map(video => {
        const stats = videoStats[video.id] || { views: 0, likes: 0 };
        const thumbnail = getThumbnailUrl(video);
        return `
            <div class="related-card" onclick="openVideo(${video.id})">
                <div class="related-thumbnail">
                    ${thumbnail ? `<img src="${thumbnail}" alt="${video.title}">` : getEmbedThumbnail(video.embedUrl)}
                </div>
                <div class="related-info">
                    <h4>${video.title}</h4>
                    <div class="related-meta">
                        ${formatCount(stats.views)} views • ${formatCount(stats.likes)} likes
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Close Modal
function closeModal() {
    document.getElementById('videoModal').style.display = 'none';
    document.getElementById('videoPlayerContainer').innerHTML = '';
    document.body.style.overflow = 'auto';
    if (history.state && history.state.videoId) {
        history.back();
    } else {
        const url = window.location.pathname;
        history.replaceState(null, '', url);
    }
}

// Like Video (One like per user)
function likeVideo() {
    if (!currentVideo) return;
    const videoId = currentVideo.id;
    
    if (userLikes.has(videoId.toString())) {
        userLikes.delete(videoId.toString());
        videoStats[videoId].likes--;
    } else {
        userLikes.add(videoId.toString());
        videoStats[videoId].likes++;
    }
    
    localStorage.setItem('userLikes', JSON.stringify([...userLikes]));
    localStorage.setItem('videoStats', JSON.stringify(videoStats));
    
    document.getElementById('likeCount').textContent = `${formatCount(videoStats[videoId].likes)} likes`;
    updateLikeButton();
    displayVideos(videos);
    showRelatedVideos(currentVideo);
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
        }).catch(() => copyToClipboard(shareUrl));
    } else {
        copyToClipboard(shareUrl);
    }
}

// Copy to Clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => alert('Link copied to clipboard!'));
}

// Download Video - AUTO DETECT from embed URL
async function downloadVideo() {
    if (!currentVideo) return;
    const downloadBtn = document.querySelector('.download-btn');
    const originalText = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Preparing...</span>';
    downloadBtn.disabled = true;
    
    try {
        const embedUrl = processVideoUrl(currentVideo.embedUrl);
        let downloadUrl = await extractDownloadUrl(embedUrl);
        
        if (downloadUrl) {
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${currentVideo.title}.mp4`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            downloadBtn.innerHTML = '<i class="fas fa-check"></i><span>Downloading...</span>';
        } else {
            window.open(embedUrl, '_blank');
            downloadBtn.innerHTML = '<i class="fas fa-external-link-alt"></i><span>Opened</span>';
        }
    } catch (error) {
        downloadBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Error</span>';
        alert('Download failed. Please try again.');
    } finally {
        setTimeout(() => {
            downloadBtn.innerHTML = originalText;
            downloadBtn.disabled = false;
        }, 2000);
    }
}

// Extract Download URL from Embed URL
async function extractDownloadUrl(embedUrl) {
    if (isDirectVideoUrl(embedUrl)) return embedUrl;
    
    if (isGoogleDriveUrl(embedUrl)) {
        const fileId = extractGoogleDriveId(embedUrl);
        if (fileId) return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    
    if (embedUrl.includes('youtube.com/embed')) {
        const videoId = extractYouTubeId(embedUrl);
        if (videoId) return await extractYouTubeDownload(videoId);
    }
    
    if (embedUrl.includes('player.vimeo.com')) {
        const videoId = extractVimeoId(embedUrl);
        if (videoId) return await extractVimeoDownload(videoId);
    }
    
    if (embedUrl.includes('dailymotion.com/embed')) {
        const videoId = extractDailymotionId(embedUrl);
        if (videoId) return await extractDailymotionDownload(videoId);
    }
    
    return null;
}

// Extract YouTube Download URL
async function extractYouTubeDownload(videoId) {
    const apis = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`,
        `https://api.codetabs.com/v1/proxy?quest=https://www.youtube.com/watch?v=${videoId}`
    ];
    for (const api of apis) {
        try {
            const response = await fetch(api);
            const html = await response.text();
            const streamMatch = html.match(/"url_encoded_fmt_stream_map":"([^"]+)"/);
            if (streamMatch) {
                const streams = decodeURIComponent(streamMatch[1]);
                const urlMatch = streams.match(/url=([^&]+)/);
                if (urlMatch) return decodeURIComponent(urlMatch[1]);
            }
        } catch (e) {}
    }
    return null;
}

// Extract Vimeo Download URL
async function extractVimeoDownload(videoId) {
    try {
        const response = await fetch(`https://player.vimeo.com/video/${videoId}/config`);
        const data = await response.json();
        if (data.request?.files?.progressive) {
            const files = data.request.files.progressive;
            return files[files.length - 1].url;
        }
    } catch (e) {}
    return null;
}

// Extract Dailymotion Download URL
async function extractDailymotionDownload(videoId) {
    try {
        const response = await fetch(`https://api.dailymotion.com/video/${videoId}?fields=stream_url`);
        const data = await response.json();
        return data.stream_url;
    } catch (e) {}
    return null;
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
    const activeMap = { 'home': 0, 'trending': 1, 'viewed': 2, 'liked': 3 };
    if (activeMap[active] !== undefined) {
        items[activeMap[active]].classList.add('active');
    }
}

// Handle browser back button
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.videoId) {
        openVideo(event.state.videoId, false);
    } else {
        if (document.getElementById('videoModal').style.display === 'block') {
            closeModal();
        }
        showAllVideos();
    }
});

// Close modal on outside click
window.onclick = function(event) {
    if (event.target === document.getElementById('videoModal')) {
        closeModal();
    }
};

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') closeModal();
});

// Load videos on page load
document.addEventListener('DOMContentLoaded', function() {
    loadVideos();
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('video');
    if (videoId) openVideo(parseInt(videoId), false);
});
