# 🎬 MyVideoHub

একটি simple video streaming website যেখানে আপনি iframe দিয়ে videos embed করতে পারেন।

## ✨ Features
- 🔍 Video search
- 👍 Like button
- 📤 Share button
- ⬇️ Download button
- 📱 Responsive design
- 🎨 Modern UI

## 🚀 Setup
1. Repository clone করুন
2. `data/videos.json` এ আপনার videos add করুন
3. GitHub Pages এ deploy করুন

## 📝 Video Add করার নিয়ম
`data/videos.json` এ নতুন video add করুন:

```json
{
    "id": 4,
    "title": "Video Title",
    "description": "Video description",
    "embedUrl": "https://www.youtube.com/embed/VIDEO_ID",
    "downloadUrl": "https://direct-download-link.com/video.mp4",
    "category": "category-name"
}
