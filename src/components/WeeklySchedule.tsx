import React from 'react'

interface TimeSlot {
  hour: number
  events: {
    id: number
    title: string
    start: number
    end: number
    color: string
  }[]
}

const timeSlots: TimeSlot[] = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  events: []
}))

// サンプルイベントデータ
const sampleEvents = [
  {
    id: 1,
    title: '朝会',
    start: 9,
    end: 10,
    color: 'bg-blue-100 border-blue-500'
  },
  {
    id: 2,
    title: 'プロジェクトMTG',
    start: 14,
    end: 15,
    color: 'bg-green-100 border-green-500'
  },
  {
    id: 3,
    title: 'コードレビュー',
    start: 16,
    end: 17,
    color: 'bg-purple-100 border-purple-500'
  }
]

// イベントをタイムスロットに追加
sampleEvents.forEach(event => {
  for (let hour = event.start; hour < event.end; hour++) {
    timeSlots[hour].events.push(event)
  }
})

const days = ['日', '月', '火', '水', '木', '金', '土']

export default function WeeklySchedule() {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* ヘッダー部分 */}
      <div className="grid grid-cols-8 border-b sticky top-0 bg-white z-10">
        <div className="p-2 text-center text-sm font-medium text-gray-500">時間</div>
        {days.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* タイムスロット */}
      <div className="grid grid-cols-8 h-[400px] overflow-y-auto">
        {/* 時間列 */}
        <div className="border-r sticky left-0 bg-white z-10">
          {timeSlots.map(slot => (
            <div key={slot.hour} className="h-8 border-b text-xs text-gray-500 p-1">
              {slot.hour}:00
            </div>
          ))}
        </div>

        {/* 日付列 */}
        {days.map((_, dayIndex) => (
          <div key={dayIndex} className="border-r last:border-r-0">
            {timeSlots.map((slot, timeIndex) => (
              <div
                key={`${dayIndex}-${timeIndex}`}
                className="h-8 border-b relative"
              >
                {slot.events.map(event => (
                  <div
                    key={event.id}
                    className={`absolute left-0 right-0 mx-1 p-1 text-xs rounded ${event.color} border`}
                    style={{
                      top: `${(event.start % 1) * 100}%`,
                      height: `${(event.end - event.start) * 100}%`
                    }}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
} 