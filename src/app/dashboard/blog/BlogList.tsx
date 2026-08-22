'use client';
import { useState, useTransition } from 'react';
import { deleteBlogPost } from './actions';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Trash2, Edit2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function BlogList({ initialPosts }: { initialPosts: any[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const router = useRouter();



  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    const res = await deleteBlogPost(id);
    if (res.success) {
      setPosts(prev => prev.filter(p => p.id !== id));
      addToast({ title: 'Post deleted', type: 'success' });
    } else {
      addToast({ title: 'Error deleting post', description: res.error, type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link href="/dashboard/blog/new">
          <Button>
            <Plus className="h-4 w-4" />
            Create Post
          </Button>
        </Link>
      </div>
      
      <div className="bg-card rounded-xl border border-border/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border/60">
              <tr>
                <th className="px-6 py-4 w-full">Title</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="group block">
                      <div className="font-medium text-foreground group-hover:text-primary transition-colors">{post.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">/{post.slug}</div>
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={post.status === 'published' ? 'success' : 'default'} className="capitalize">
                      {post.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Draft'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    <Link href={`/dashboard/blog/${post.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No blog posts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
