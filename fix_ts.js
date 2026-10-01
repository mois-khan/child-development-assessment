const fs = require('fs');

let courses = fs.readFileSync('app/admin/(protected)/courses/page.tsx', 'utf8');
courses = courses.replace('is_active: isActive\n    };', 'is_active: isActive,\n      sort_order: editingCourse ? editingCourse.sort_order : 0\n    };');
courses = courses.replace('variant="outline"', 'variant="secondary"');
fs.writeFileSync('app/admin/(protected)/courses/page.tsx', courses);

let videos = fs.readFileSync('app/admin/(protected)/milestone-videos/page.tsx', 'utf8');
videos = videos.replace('is_active: isActive\n    };', 'is_active: isActive,\n      sort_order: editingVideo ? editingVideo.sort_order : 0\n    };');
fs.writeFileSync('app/admin/(protected)/milestone-videos/page.tsx', videos);
