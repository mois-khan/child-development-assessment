const fs = require('fs');

let content = fs.readFileSync('components/ReportDocument.tsx', 'utf8');

// Add imports
content = content.replace(
  'import { Avatar, LoadError, TopBar, Wordmark, Button } from "@/components/ui";', 
  'import { Avatar, LoadError, TopBar, Wordmark, Button } from "@/components/ui";\nimport { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";\nimport { ZoomIn, ZoomOut, Maximize } from "lucide-react";'
);

// Find the <main> tag (regardless of newlines) and replace
content = content.replace(
  /<main className="bg-gray-100 min-h-screen py-8 print:py-0 print:bg-white flex flex-col items-center[\s\S]*?print:block print:min-h-0">/,
  `<main className="bg-gray-100 min-h-screen py-8 print:py-0 print:bg-white flex flex-col items-center print:block print:min-h-0 overflow-hidden">
      <TransformWrapper
        initialScale={1}
        minScale={0.2}
        maxScale={4}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <div className="w-full flex flex-col relative print:!block">
            <div className="no-print fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200">
              <button onClick={() => zoomOut()} className="p-2 hover:bg-gray-100 rounded-full text-gray-700 transition-colors"><ZoomOut size={20} /></button>
              <button onClick={() => resetTransform()} className="p-2 hover:bg-gray-100 rounded-full text-gray-700 transition-colors"><Maximize size={18} /></button>
              <button onClick={() => zoomIn()} className="p-2 hover:bg-gray-100 rounded-full text-gray-700 transition-colors"><ZoomIn size={20} /></button>
            </div>
            <TransformComponent wrapperClass="!w-full print:!transform-none print:!w-auto" contentClass="w-full flex flex-col items-center print:!transform-none">`
);

content = content.replace(
  /<\/main>/,
  `            </TransformComponent>
          </div>
        )}
      </TransformWrapper>
    </main>`
);

// Replace A4Page component to enforce strict 210mm width
content = content.replace(
  /const A4Page = \(\{ children, className = "" \}: \{ children: React.ReactNode; className\?: string \}\) => \([\s\S]*?<\/div>\n\);/,
  `const A4Page = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
<div
  className={\`w-[210mm] mx-auto bg-white my-8 shadow-lg print:my-0 print:shadow-none relative overflow-hidden break-after-page print:last:break-after-auto text-black flex flex-col p-[15mm] border border-gray-200 print:border-none print:h-[297mm] print:max-h-[297mm] min-h-[297mm] \$\{className\}\`}
  style={{ pageBreakInside: "avoid", breakInside: "avoid" }}
>
  {children}
</div>
);`
);

// Remove `overflow-x-auto` wrappers I might have added for tables previously, 
// since they are now fixed width inside the 210mm container.
content = content.replace(/<div className="w-full overflow-x-auto pb-4">/g, '<div className="w-full pb-4">');

fs.writeFileSync('components/ReportDocument.tsx', content);
console.log('Successfully injected ZoomPan component.');
