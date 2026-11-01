import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import TaskItem from '../components/TaskItem';
import { updateProgressSection } from '../lib/api';
import { syncDsaData } from '../lib/progress';
import { useProfile } from '../context/ProfileContext';

function tomorrowIso() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return date.toISOString();
}

// ── Skeleton placeholder shown while data loads ──────────────────────────────
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

const DSA = () => {
  const { profile, loadCatalog } = useProfile();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (!profile) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const catalog = await loadCatalog();
        const merged = syncDsaData(catalog.dsaData || [], profile.dsaData || []);
        setData(merged);
      } catch (error) {
        console.error('Failed to load DSA data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  // loadCatalog is stable (memoised), profile identity changes only on login/logout
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const persistData = async (updatedData, updateActivity = true) => {
    setData(updatedData);

    try {
      await updateProgressSection('dsaData', updatedData, updateActivity);
    } catch (error) {
      console.error('Failed to save DSA progress:', error);
    }
  };

  const updateItem = async (topicName, propName, itemName, createChanges, updateActivity = true) => {
    const updated = data.map((topic) => {
      if (topic.name !== topicName || !Array.isArray(topic[propName])) {
        return topic;
      }

      return {
        ...topic,
        [propName]: topic[propName].map((item) =>
          item.name === itemName ? { ...item, ...createChanges(item) } : item
        ),
      };
    });

    await persistData(updated, updateActivity);
  };

  const handleOpenPdf = async (topicName, propName, itemName, pdf) => {
    if (pdf) {
      window.open(pdf, '_blank');
      await updateItem(
        topicName,
        propName,
        itemName,
        () => ({ opened: true, lastOpenedAt: new Date().toISOString() }),
        false
      );
    }
  };

  const handleOpenResource = async (topicName, propName, itemName, resource) => {
    if (resource) {
      window.open(resource, '_blank');
      await updateItem(
        topicName,
        propName,
        itemName,
        () => ({ opened: true, lastOpenedAt: new Date().toISOString() }),
        false
      );
    }
  };

  const handleMarkDone = async (topicName, propName, itemName) => {
    const completedStamp = new Date().toISOString();
    await updateItem(topicName, propName, itemName, (item) => ({
      completed: true,
      completedAt: item.completedAt || completedStamp,
      lastCompletedAt: completedStamp,
    }));
  };

  const handleToggleBookmark = async (topicName, propName, itemName) => {
    await updateItem(topicName, propName, itemName, (item) => ({ bookmarked: !item.bookmarked }), false);
  };

  const handleToggleRevision = async (topicName, propName, itemName) => {
    await updateItem(
      topicName,
      propName,
      itemName,
      (item) => ({ reviseAt: item.reviseAt ? null : tomorrowIso() }),
      false
    );
  };

  const toggleExpanded = (topicName) => {
    setExpanded((prev) => ({ ...prev, [topicName]: !prev[topicName] }));
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
        className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center justify-center gap-4"
      >
        DSA
      </motion.h1>

      <div className="space-y-6">
        {loading ? (
          // Show 4 skeleton cards while data loads
          [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)
        ) : (
          data.map((topic, index) => (
            <motion.div
              key={topic.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="glass-card glass-hover overflow-hidden"
            >
              <motion.div
                onClick={() => toggleExpanded(topic.name)}
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                className="p-6 cursor-pointer border-b border-white/20"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-white">{topic.name}</h2>
                  <motion.span
                    animate={{ rotate: expanded[topic.name] ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-2xl"
                  >
                    ▼
                  </motion.span>
                </div>
              </motion.div>
              <motion.div
                initial={false}
                animate={{ height: expanded[topic.name] ? 'auto' : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-6">
                  {Object.keys(topic).map((propName) => {
                    if (propName !== 'name' && Array.isArray(topic[propName])) {
                      return (
                        <div key={propName} className="mb-6">
                          <h3 className="text-lg font-medium mb-4 text-blue-600 dark:text-blue-400">
                            {propName}
                          </h3>
                          <div className="space-y-2">
                            {topic[propName].map((item) => (
                              <TaskItem
                                key={item.name}
                                item={item}
                                onOpenPdf={() => handleOpenPdf(topic.name, propName, item.name, item.pdf)}
                                onOpenResource={() =>
                                  handleOpenResource(topic.name, propName, item.name, item.resource)
                                }
                                onMarkDone={() => handleMarkDone(topic.name, propName, item.name)}
                                onToggleBookmark={() => handleToggleBookmark(topic.name, propName, item.name)}
                                onToggleRevision={() => handleToggleRevision(topic.name, propName, item.name)}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </motion.div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default DSA;
