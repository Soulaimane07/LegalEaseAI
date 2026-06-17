import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Tailwind-styled renderers (avoids needing the typography plugin).
// `dir="auto"` lets each block pick FR (ltr) or AR (rtl) automatically.
const components = {
  h1: ({ node, ...p }) => <h1 className="text-lg font-bold text-gray-900 mt-4 mb-2 first:mt-0" dir="auto" {...p} />,
  h2: ({ node, ...p }) => <h2 className="text-base font-bold text-gray-900 mt-4 mb-2 first:mt-0" dir="auto" {...p} />,
  h3: ({ node, ...p }) => <h3 className="text-[15px] font-semibold text-gray-900 mt-3 mb-1.5" dir="auto" {...p} />,
  p:  ({ node, ...p }) => <p className="mb-2.5 last:mb-0 leading-relaxed" dir="auto" {...p} />,
  ul: ({ node, ...p }) => <ul className="list-disc ml-5 mb-2.5 space-y-1.5 marker:text-gray-400" {...p} />,
  ol: ({ node, ...p }) => <ol className="list-decimal ml-5 mb-2.5 space-y-1.5 marker:text-gray-400" {...p} />,
  li: ({ node, ...p }) => <li className="leading-relaxed" dir="auto" {...p} />,
  strong: ({ node, ...p }) => <strong className="font-semibold text-gray-900" {...p} />,
  em: ({ node, ...p }) => <em className="italic" {...p} />,
  hr: () => <hr className="my-4 border-gray-200" />,
  a: ({ node, ...p }) => <a className="text-blue-600 underline hover:text-blue-700" target="_blank" rel="noreferrer" {...p} />,
  blockquote: ({ node, ...p }) => (
    <blockquote className="border-l-3 border-blue-200 bg-blue-50/40 pl-3 py-1 italic text-gray-600 my-2.5 rounded-r" dir="auto" {...p} />
  ),
  code: ({ node, inline, ...p }) =>
    inline ? (
      <code className="bg-gray-200/70 text-gray-800 px-1.5 py-0.5 rounded text-[13px] font-mono" {...p} />
    ) : (
      <code className="block bg-gray-100 text-gray-800 p-3 rounded-lg text-[13px] font-mono overflow-x-auto my-2.5" {...p} />
    ),
  table: ({ node, ...p }) => (
    <div className="overflow-x-auto my-3">
      <table className="border-collapse text-sm w-full" {...p} />
    </div>
  ),
  thead: ({ node, ...p }) => <thead className="bg-gray-100" {...p} />,
  th: ({ node, ...p }) => <th className="border border-gray-300 px-3 py-1.5 text-left font-semibold" dir="auto" {...p} />,
  td: ({ node, ...p }) => <td className="border border-gray-200 px-3 py-1.5 align-top" dir="auto" {...p} />,
};

export default function MarkdownMessage({ content }) {
  return (
    <div className="text-[15px] text-gray-800 break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content || ''}
      </ReactMarkdown>
    </div>
  );
}
