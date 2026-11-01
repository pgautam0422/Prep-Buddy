import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import TaskItem from '../components/TaskItem';
import { updateProgressSection } from '../lib/api';
import { syncGroupedData } from '../lib/progress';
import { useProfile } from '../context/ProfileContext';

function tomorrowIso() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return date.toISOString();
}

const SkeletonCard = () => (
  <div className="glass-card p-6 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-6 bg-white/10 rounded w-1/3" />
      <div className="h-6 w-6 bg-white/10 rounded" />
    </div>
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-12 bg-white/5 rounded-lg" />
      ))}
    </div>
  </div>
);

const Aptitude = () => {
  const { profile, loadCatalog } = useProfile();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (!profile) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const catalog = await loadCatalog();
        setData(syncGroupedData(catalog.aptitudeData || {}, profile.aptitudeData || {}, 'aptitude'));
      } catch (error) {
        console.error('Failed to load aptitude progress:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const persistData = async (updatedData, updateActivity = true) => {
    setData(updatedData);

    try {
      await updateProgressSection('aptitudeData', updatedData, updateActivity);
    } catch (error) {
      console.error('Failed to save aptitude progress:', error);
    }
  };

  const updateItem = async (category, itemName, createChanges, updateActivity = true) => {
    const updated = { ...data };
    updated[category] = updated[category].map((item) =>
      item.name === itemName ? { ...item, ...createChanges(item) } : item
    );
    await persistData(updated, updateActivity);
  };

  const handleOpenPdf = async (category, itemName, pdf) => {
    if (pdf) {
      window.open(pdf, '_blank');
      await updateItem(category, itemName, () => ({ opened: true, lastOpenedAt: new Date().toISOString() }), false);
    }
  };

  const handleOpenResource = async (category, itemName, resource) => {
    if (resource) {
      window.open(resource, '_blank');
      await updateItem(category, itemName, () => ({ opened: true, lastOpenedAt: new Date().toISOString() }), false);
    }
  };

  const handleMarkDone = async (category, itemName) => {
    const completedStamp = new Date().toISOString();
    await updateItem(category, itemName, (item) => ({
      completed: true,
      completedAt: item.completedAt || completedStamp,
      lastCompletedAt: completedStamp,
    }));
  };

  const handleToggleBookmark = async (category, itemName) => {
    await updateItem(category, itemName, (item) => ({ bookmarked: !item.bookmarked }), false);
  };

  const handleToggleRevision = async (category, itemName) => {
    await updateItem(category, itemName, (item) => ({ reviseAt: item.reviseAt ? null : tomorrowIso() }), false);
  };

  const toggleExpanded = (category) => {
    setExpanded((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-4 sm:p-6 md:p-8"
    >
      <motion.h1
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
      >
        Aptitude
      </motion.h1>

      <div className="space-y-6">
        {loading ? (
          [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)
        ) : (
          Object.entries(data).map(([category, items], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="glass-card glass-hover overflow-hidden"
            >
              <motion.div
                onClick={() => toggleExpanded(category)}
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                className="p-6 cursor-pointer border-b border-white/20"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-white">{category}</h2>
                  <motion.span
                    animate={{ rotate: expanded[category] ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-2xl"
                  >
                    ▼
                  </motion.span>
                </div>
              </motion.div>
              <motion.div
                initial={false}
                animate={{ height: expanded[category] ? 'auto' : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-6">
                  <div className="space-y-2">
                    {items.map((item) => (
                      <TaskItem
                        key={item.name}
                        item={item}
                        onOpenPdf={() => handleOpenPdf(category, item.name, item.pdf)}
                        onOpenResource={() => handleOpenResource(category, item.name, item.resource)}
                        onMarkDone={() => handleMarkDone(category, item.name)}
                        onToggleBookmark={() => handleToggleBookmark(category, item.name)}
                        onToggleRevision={() => handleToggleRevision(category, item.name)}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default Aptitude;
