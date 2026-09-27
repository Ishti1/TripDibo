import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface LocationInfoProps {
  location: string;
}

interface WikiData {
  title: string;
  extract: string;
  thumbnail?: { source: string; width: number; height: number };
  description?: string;
}

const LocationInfo: React.FC<LocationInfoProps> = ({ location }) => {
  const [data, setData] = useState<WikiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) return;
    const fetchInfo = async () => {
      try {
        const res = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(location)}`
        );
        if (!res.ok) {
          throw new Error('Failed to fetch location data');
        }
        const json = await res.json();
        setData({
          title: json.title,
          extract: json.extract,
          thumbnail: json.thumbnail,
          description: json.description,
        });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Unable to load location');
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [location]);

  if (loading) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading information about {location}...</p>;
  }
  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }
  if (!data) return null;

  return (
    <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
      {data.thumbnail && (
        <Image
          unoptimized
          width={96}
          height={96}
          src={data.thumbnail.source}
          alt={data.title}
          className="float-left mr-4 mb-2 w-24 h-24 object-cover rounded-md"
        />
      )}
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{data.title}</h2>
      {data.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 italic mb-2">{data.description}</p>
      )}
      <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed">{data.extract}</p>
      <div className="clear-both"></div>
    </div>
  );
};

export default LocationInfo;
