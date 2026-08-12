import { useState, useEffect } from "react";
import { Calendar, Clock, Bell, Check, Plus, X, Music, Flag, Flame } from "lucide-react";

interface ScheduledEvent {
  id: string;
  title: string;
  time: string;
  type: "music" | "podcast" | "special";
  description: string;
  isCompleted: boolean;
}

const independenceDaySchedule: ScheduledEvent[] = [
  {
    id: "1",
    title: "Morning Patriotic Songs",
    time: "06:00 AM",
    type: "music",
    description: "Start Independence Day with iconic Tamil patriotic songs",
    isCompleted: false
  },
  {
    id: "2",
    title: "Independence Day Special Podcast",
    time: "09:00 AM",
    type: "podcast",
    description: "Live broadcast: Stories of freedom and Tamil Nadu's role",
    isCompleted: false
  },
  {
    id: "3",
    title: "Classical Independence Concert",
    time: "12:00 PM",
    type: "music",
    description: "Carnatic music compositions celebrating freedom",
    isCompleted: false
  },
  {
    id: "4",
    title: "Folk Freedom Songs",
    time: "03:00 PM",
    type: "music",
    description: "Traditional Tamil folk songs of resistance and pride",
    isCompleted: false
  },
  {
    id: "5",
    title: "Cinematic Patriotism",
    time: "06:00 PM",
    type: "podcast",
    description: "Tamil cinema's tribute to Indian independence",
    isCompleted: false
  },
  {
    id: "6",
    title: "Evening Patriotic Mashup",
    time: "08:00 PM",
    type: "special",
    description: "Special DJ mix of patriotic Tamil hits",
    isCompleted: false
  }
];

export function IndependenceDayScheduler() {
  const [schedule, setSchedule] = useState<ScheduledEvent[]>(independenceDaySchedule);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const toggleReminder = (eventId: string) => {
    setSchedule(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, isCompleted: !event.isCompleted }
        : event
    ));
  };

  const isEventActive = (eventTime: string) => {
    const now = currentTime;
    const [hours, minutes] = eventTime.split(' ')[0].split(':').map(Number);
    const ampm = eventTime.split(' ')[1];
    
    let eventHours = hours;
    if (ampm === 'PM' && hours !== 12) eventHours += 12;
    if (ampm === 'AM' && hours === 12) eventHours = 0;
    
    const eventDate = new Date();
    eventDate.setHours(eventHours, minutes, 0, 0);
    
    const diff = (eventDate.getTime() - now.getTime()) / (1000 * 60);
    return diff >= 0 && diff <= 60; // Within 1 hour
  };

  const getEventIcon = (type: ScheduledEvent['type']) => {
    switch (type) {
      case 'music': return Music;
      case 'podcast': return Flag;
      case 'special': return Flame;
      default: return Music;
    }
  };

  const getEventColor = (type: ScheduledEvent['type']) => {
    switch (type) {
      case 'music': return 'text-orange-400';
      case 'podcast': return 'text-green-400';
      case 'special': return 'text-yellow-400';
      default: return 'text-primary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-orange-400 animate-pulse" />
            Independence Day Schedule
          </h3>
          <p className="text-muted-foreground mt-1">August 15, 2026 • Full day patriotic programming</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              notificationsEnabled
                ? 'bg-orange-500 text-white shadow-glow'
                : 'bg-card/40 text-muted-foreground hover:bg-card'
            }`}
          >
            <Bell className="h-4 w-4" />
            {notificationsEnabled ? 'Reminders On' : 'Set Reminders'}
          </button>
        </div>
      </div>

      {/* Schedule timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500 via-white to-green-500" />

        <div className="space-y-4">
          {schedule.map((event, index) => {
            const Icon = getEventIcon(event.type);
            const isActive = isEventActive(event.time);
            const colorClass = getEventColor(event.type);

            return (
              <div
                key={event.id}
                className={`relative pl-16 p-4 rounded-2xl border transition-all duration-300 ${
                  isActive
                    ? 'border-orange-500/50 bg-orange-500/10 animate-pulse'
                    : event.isCompleted
                    ? 'border-green-500/30 bg-green-500/5 opacity-60'
                    : 'border-border bg-card/40 hover:bg-card'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Timeline dot */}
                <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-full border-2 ${
                  isActive
                    ? 'bg-orange-500 border-orange-300 animate-pulse'
                    : event.isCompleted
                    ? 'bg-green-500 border-green-300'
                    : 'bg-background border-primary'
                }`} />

                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-2 rounded-lg bg-background/60 ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{event.title}</span>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-xs font-bold animate-pulse">
                            LIVE NOW
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.time}
                      </div>
                      <div className="px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-300 text-xs capitalize">
                        {event.type}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleReminder(event.id)}
                      className={`p-2 rounded-full transition-colors ${
                        event.isCompleted
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-card/60 text-muted-foreground hover:text-green-400'
                      }`}
                    >
                      {event.isCompleted ? <Check className="h-4 w-4" /> <Bell className="h-4 w-4" />}
                    </button>
                    <button className="p-2 rounded-full bg-card/60 text-muted-foreground hover:text-primary transition-colors">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add custom event button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full p-4 rounded-2xl border border-dashed border-border bg-card/20 hover:bg-card/40 transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-4 w-4" />
        Add Custom Event
      </button>

      {/* Countdown to August 15 */}
      <div className="p-6 rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-white/5 to-green-500/10 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-foreground flex items-center gap-2">
              <Flag className="h-5 w-5 text-orange-400" />
              Independence Day Countdown
            </h4>
            <p className="text-sm text-muted-foreground mt-1">Until August 15, 2026</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">
                {Math.ceil((new Date('2026-08-15') - new Date()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-xs text-muted-foreground">Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {new Date('2026-08-15').getHours() - new Date().getHours()}
              </div>
              <div className="text-xs text-muted-foreground">Hours</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}