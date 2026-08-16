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
            embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            category: "nature"
        },
        {
            id: 2,
            title: "Big Buck Bunny - Animation",
            description: "Classic animation short film about a big rabbit.",
            embedUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ",
            category: "animation"
        },
        {
            id: 3,
            title: "Music Video - Top Hits",
            description: "Latest music videos collection.",
            embedUrl: "https://www.youtube.com/embed/9bZkp7q19f0",
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
    // If YouTube, use auto thumbnail
    if (video.embedUrl.includes('youtube.com') || video.embedUrl.includes('youtu.be')) {
        const videoId = extractYouTubeId(video.embedUrl);
        if (videoId) {
            return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
    }
    return null;
}

// Get Embed Thumbnail (fallback: use iframe as thumbnail)
function getEmbedThumbnail(embedUrl) {
    if (isDirectVideoUrl(embedUrl)) {
        return `<video src="${embedUrl}" muted></video>`;
    } else {
        return `<iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`;
    }
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
    
    // Update like button state
    updateLikeButton();
    
    // Show related videos
    showRelatedVideos(currentVideo);
    
    // Show modal
    document.getElementById('videoModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Update browser history
    if (pushState) {
        history.pushState({ videoId: videoId }, '', `?video=${videoId}`);
    }
    
    // Refresh grid to show updated views
    displayVideos(videos);
}

// Update Video Player (handles iframe, direct video, Google Drive)
function updateVideoPlayer(video) {
    const container = document.getElementById('videoPlayerContainer');
    const embedUrl = video.embedUrl;
    
    if (isDirectVideoUrl(embedUrl)) {
        container.innerHTML = `<video controls autoplay src="${embedUrl}"></video>`;
    } else if (isGoogleDriveUrl(embedUrl)) {
        // Convert Google Drive share link to embeddable
        const fileId = extractGoogleDriveId(embedUrl);
        if (fileId) {
            container.innerHTML = `<iframe src="https://drive.google.com/file/d/${fileId}/preview" frameborder="0" allowfullscreen allow="autoplay"></iframe>`;
        } else {
            container.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`;
        }
    } else {
        container.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;
    }
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
    const match = url.match(/\/file\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
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
    // Remove query param when closing
    if (history.state && history.state.videoId) {
        history.back();
    } else {
        // If no state, just remove query string without adding history
        const url = window.location.pathname;
        history.replaceState(null, '', url);
    }
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
    
    // Refresh grid and related
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

// Download Video - AUTO DETECT from embed URL
async function downloadVideo() {
    if (!currentVideo) return;
    
    const downloadBtn = document.querySelector('.download-btn');
    const originalText = downloadBtn.innerHTML;
    
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Preparing...</span>';
    downloadBtn.disabled = true;
    
    try {
        const embedUrl = currentVideo.embedUrl;
        let downloadUrl = await extractDownloadUrl(embedUrl);
        
        if (downloadUrl) {
            // Trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${currentVideo.title}.mp4`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            downloadBtn.innerHTML = '<i class="fas fa-check"></i><span>Downloading...</span>';
            setTimeout(() => {
                downloadBtn.innerHTML = originalText;
                downloadBtn.disabled = false;
            }, 2000);
        } else {
            // Fallback: Open embed URL in new tab
            window.open(embedUrl, '_blank');
            downloadBtn.innerHTML = '<i class="fas fa-external-link-alt"></i><span>Opened</span>';
            setTimeout(() => {
                downloadBtn.innerHTML = originalText;
                downloadBtn.disabled = false;
            }, 2000);
        }
    } catch (error) {
        console.error('Download error:', error);
        downloadBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Error</span>';
        setTimeout(() => {
            downloadBtn.innerHTML = originalText;
            downloadBtn.disabled = false;
        }, 2000);
        alert('Download failed. Please try again.');
    }
}

// Extract Download URL from Embed URL
async function extractDownloadUrl(embedUrl) {
    // If direct video file, return as is
    if (isDirectVideoUrl(embedUrl)) {
        return embedUrl;
    }
    
    // Google Drive
    if (isGoogleDriveUrl(embedUrl)) {
        const fileId = extractGoogleDriveId(embedUrl);
        if (fileId) {
            return `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
    }
    
    // YouTube
    if (embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be')) {
        return await extractYouTubeDownload(embedUrl);
    }
    
    // Vimeo
    if (embedUrl.includes('vimeo.com')) {
        return await extractVimeoDownload(embedUrl);
    }
    
    // Dailymotion
    if (embedUrl.includes('dailymotion.com')) {
        return await extractDailymotionDownload(embedUrl);
    }
    
    return null;
}

// Extract YouTube Download URL
async function extractYouTubeDownload(url) {
    const videoId = extractYouTubeId(url);
    if (!videoId) return null;
    
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
                if (urlMatch) {
                    return decodeURIComponent(urlMatch[1]);
                }
            }
        } catch (error) {
            console.log('API failed:', api);
        }
    }
    return null;
}

// Extract YouTube Video ID
function extractYouTubeId(url) {
    const patterns = [
        /youtube\.com\/embed\/([^/?]+)/,
        /youtube\.com\/watch\?v=([^&]+)/,
        /youtu\.be\/([^/?]+)/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Extract Vimeo Download URL
async function extractVimeoDownload(url) {
    const videoId = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (!videoId) return null;
    try {
        const response = await fetch(`https://player.vimeo.com/video/${videoId[1]}/config`);
        const data = await response.json();
        if (data.request && data.request.files && data.request.files.progressive) {
            const files = data.request.files.progressive;
            const bestQuality = files[files.length - 1];
            return bestQuality.url;
        }
    } catch (error) {
        console.error('Vimeo extraction failed:', error);
    }
    return null;
}

// Extract Dailymotion Download URL
async function extractDailymotionDownload(url) {
    const videoId = url.match(/dailymotion\.com\/video\/([^_?]+)/);
    if (!videoId) return null;
    try {
        const response = await fetch(`https://api.dailymotion.com/video/${videoId[1]}?fields=stream_url`);
        const data = await response.json();
        return data.stream_url;
    } catch (error) {
        console.error('Dailymotion extraction failed:', error);
    }
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

// Handle browser back button
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.videoId) {
        // User navigated back to a video state, reopen modal
        const videoId = event.state.videoId;
        openVideo(videoId, false);
    } else {
        // No state, close modal if open
        if (document.getElementById('videoModal').style.display === 'block') {
            closeModal();
        }
        // Show all videos
        showAllVideos();
    }
});

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
document.addEventListener('DOMContentLoaded', function() {
    loadVideos();
    // Check if there's a video ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('video');
    if (videoId) {
        openVideo(parseInt(videoId), false);
    }
});
