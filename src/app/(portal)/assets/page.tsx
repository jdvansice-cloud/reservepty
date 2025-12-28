'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Plus, Plane, Navigation2, Building2, Ship } from 'lucide-react';
import Link from 'next/link';

export default function AssetsPage() {
  const { session, organizationId, entitlements } = useAuth();
  const { language } = useLanguage();
  const [assets, setAssets] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const t = { en: { title: 'Assets', addAsset: 'Add Asset', noAssets: 'No assets found', all: 'All' }, es: { title: 'Activos', addAsset: 'Agregar Activo', noAssets: 'No se encontraron activos', all: 'Todos' } };
  const text = t[language];
  const sectionIcons: Record<string, any> = { planes: Plane, helicopters: Navigation2, residences: Building2, boats: Ship };

  useEffect(() => {
    async function fetchAssets() {
      if (!session?.access_token || !organizationId) return;
      try {
        const response = await fetch(`/api/assets?organizationId=${organizationId}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (response.ok) { const data = await response.json(); setAssets(data.assets || []); }
      } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
    }
    fetchAssets();
  }, [session, organizationId]);

  const filteredAssets = filter === 'all' ? assets : assets.filter(a => a.section === filter);
  const activeSections = entitlements.filter(e => e.is_active).map(e => e.section);

  return (
    <div className="p-6 pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{text.title}</h1>
        <Link href="/assets/new" className="flex items-center gap-2 bg-[#c8b273] text-[#0a1628] px-4 py-2 rounded-lg font-semibold">
          <Plus className="w-5 h-5" />{text.addAsset}
        </Link>
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg whitespace-nowrap ${filter === 'all' ? 'bg-[#c8b273] text-[#0a1628]' : 'bg-white/10 text-white'}`}>{text.all}</button>
        {activeSections.map(section => (
          <button key={section} onClick={() => setFilter(section)} className={`px-4 py-2 rounded-lg whitespace-nowrap capitalize ${filter === section ? 'bg-[#c8b273] text-[#0a1628]' : 'bg-white/10 text-white'}`}>{section}</button>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#c8b273] border-t-transparent rounded-full animate-spin" /></div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-12 text-white/50">{text.noAssets}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map(asset => {
            const Icon = sectionIcons[asset.section] || Plane;
            return (
              <Link key={asset.id} href={`/assets/${asset.id}`} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-[#c8b273]/50 transition-colors">
                {asset.primary_photo_url ? (
                  <img src={asset.primary_photo_url} alt={asset.name} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-white/10 flex items-center justify-center"><Icon className="w-12 h-12 text-white/30" /></div>
                )}
                <div className="p-4">
                  <h3 className="text-white font-semibold">{asset.name}</h3>
                  <p className="text-white/50 text-sm capitalize">{asset.section}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
