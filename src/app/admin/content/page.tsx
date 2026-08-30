import Link from 'next/link';
import { Plus, Edit2, Globe, Lock } from 'lucide-react';

export default function AdminContentPage() {
  const articles = [
    { id: 1, title: 'The 2026 Tech Hiring Outlook', status: 'published', author: 'JobOS Editorial' },
    { id: 2, title: 'How to bypass ATS Filters', status: 'draft', author: 'JobOS Intelligence' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-heading">Job Intelligence CMS</h2>
        <Link 
          href="/admin/content/new" 
          className="flex items-center space-x-2 bg-primary-teal text-bg-main px-4 py-2 rounded-xl font-bold hover:bg-primary-teal-dark transition-colors"
        >
          <Plus size={18} />
          <span>New Article</span>
        </Link>
      </div>
      
      <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg-secondary border-b border-border-light text-text-muted text-xs uppercase tracking-wider">
              <th className="p-4 font-bold">Title</th>
              <th className="p-4 font-bold">Author</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {articles.map(article => (
              <tr key={article.id} className="hover:bg-bg-hover transition-colors">
                <td className="p-4 text-sm font-bold text-text-heading">{article.title}</td>
                <td className="p-4 text-sm text-text-charcoal">{article.author}</td>
                <td className="p-4 text-sm">
                  {article.status === 'published' ? (
                    <span className="inline-flex items-center space-x-1 text-primary-teal bg-primary-teal-light px-2 py-1 rounded-md text-xs font-bold uppercase">
                      <Globe size={12} /> <span>Published</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-text-muted bg-bg-secondary border border-border-light px-2 py-1 rounded-md text-xs font-bold uppercase">
                      <Lock size={12} /> <span>Draft</span>
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <button className="p-2 text-text-muted hover:text-primary-teal transition-colors rounded-lg hover:bg-primary-teal-light">
                    <Edit2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
