# HarumiGiftsBox

A beautiful 3D gift box with particle effects built using Three.js and Vite.

## Features

- 3D heart model with particle effects
- Responsive design
- Dark mode support
- Custom font support (Mali)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Place required assets:
- Put `Mali.ttf` in `public/font/`
- Put your music file in `public/storage/musics/`
- Put `heart.obj` in the root directory

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
HarumiGiftsBox/
├── src/
│   └── main.js
├── public/
│   ├── font/
│   │   └── Mali.ttf
│   └── storage/
│       └── musics/
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Dependencies

- Three.js - 3D graphics library
- Troika Three Text - Text rendering for Three.js
- Vite - Build tool and development server 