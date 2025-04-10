'use client'

import React, { useMemo, useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, subDays, addDays, subWeeks, addWeeks, subMonths, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { WorkloadSummaryByPeriod } from '../types/schedule';
import { formatHours, getWeekKey, getMonthKey } from '../utils/workloadUtils';

interface WorkloadSummaryViewProps {
  workloadData: WorkloadSummaryByPeriod;
  currentDate: Date;
  onCurrentDateChange?: (date: Date) => void;
}

export default function WorkloadSummaryView({ 
  workloadData, 
  currentDate,
  onCurrentDateChange
}: WorkloadSummaryViewProps) {
  // 日、週、月ごとに独立した日付状態を管理
  const [dayDate, setDayDate] = useState<Date>(currentDate);
  const [weekDate, setWeekDate] = useState<Date>(currentDate);
  const [monthDate, setMonthDate] = useState<Date>(currentDate);

  // 外部からcurrentDateが変更されたら全ての日付を同期
  useEffect(() => {
    setDayDate(currentDate);
    setWeekDate(currentDate);
    setMonthDate(currentDate);
  }, [currentDate]);

  // 日付のキーを取得
  const dateKey = useMemo(() => format(dayDate, 'yyyy-MM-dd'), [dayDate]);
  const weekKey = useMemo(() => getWeekKey(weekDate), [weekDate]);
  const monthKey = useMemo(() => getMonthKey(monthDate), [monthDate]);
  
  // 各期間の工数データを取得
  const dayData = useMemo(() => 
    workloadData.daily.get(dateKey) || {
      externalHours: 0,
      internalHours: 0,
      bufferHours: 0,
      freeHours: 0,
      totalHours: 0
    }, 
  [workloadData, dateKey]);
  
  const weekData = useMemo(() => 
    workloadData.weekly.get(weekKey) || {
      externalHours: 0,
      internalHours: 0,
      bufferHours: 0,
      freeHours: 0,
      totalHours: 0
    }, 
  [workloadData, weekKey]);
  
  const monthData = useMemo(() => 
    workloadData.monthly.get(monthKey) || {
      externalHours: 0,
      internalHours: 0,
      bufferHours: 0,
      freeHours: 0,
      totalHours: 0
    }, 
  [workloadData, monthKey]);
  
  // 日付範囲のラベルを生成
  const dateRanges = useMemo(() => {
    const day = {
      label: format(dayDate, 'M/d（E）', { locale: ja }),
      start: startOfDay(dayDate),
      end: endOfDay(dayDate)
    };
    
    const week = {
      label: `${format(startOfWeek(weekDate, { locale: ja }), 'M/d')} 〜 ${format(endOfWeek(weekDate, { locale: ja }), 'M/d')}`,
      start: startOfWeek(weekDate, { locale: ja }),
      end: endOfWeek(weekDate, { locale: ja })
    };
    
    const month = {
      label: format(monthDate, 'yyyy年M月', { locale: ja }),
      start: startOfMonth(monthDate),
      end: endOfMonth(monthDate)
    };
    
    return { day, week, month };
  }, [dayDate, weekDate, monthDate]);
  
  // 円グラフコンポーネント
  const DonutChart = ({ 
    data, 
    maxHours, 
    title 
  }: { 
    data: typeof dayData; 
    maxHours: number; 
    title: string 
  }) => {
    // 円グラフのセグメントの計算
    const segments = [
      { 
        value: data.externalHours, 
        color: '#3B82F6', // blue-500
        hoverColor: '#2563EB', // blue-600
        label: '外部予定'
      },
      { 
        value: data.internalHours, 
        color: '#22C55E', // green-500
        hoverColor: '#16A34A', // green-600
        label: '内部TODO'
      },
      { 
        value: data.bufferHours, 
        color: '#F97316', // orange-500
        hoverColor: '#EA580C', // orange-600
        label: 'バッファ'
      },
      { 
        value: data.freeHours, 
        color: '#E5E7EB', // gray-200
        hoverColor: '#D1D5DB', // gray-300
        label: '空き時間'
      }
    ];
    
    // 円グラフの描画パラメータ
    const size = 120; // グラフサイズ
    const strokeWidth = 20; // 円の太さ
    const radius = (size - strokeWidth) / 2; // 円の半径
    const center = size / 2; // 中心座標
    
    // 円弧の描画を計算
    let totalAngle = 0;
    const nonEmptySegments = segments.filter(s => s.value > 0);
    
    return (
      <div className="flex flex-col items-center">
        <h4 className="text-sm font-medium mb-2">{title}</h4>
        <div className="relative" style={{ width: size, height: size }}>
          {/* 空グラフ（背景） */}
          {data.totalHours === 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth={strokeWidth}
            />
          )}
          
          {/* セグメント */}
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {nonEmptySegments.map((segment, index) => {
              // 各セグメントの円弧を計算
              const segmentPercentage = segment.value / (maxHours || 1);
              const segmentAngle = segmentPercentage * 360;
              
              // 円弧の開始点と終了点
              const startAngle = totalAngle;
              const endAngle = totalAngle + segmentAngle;
              
              // 円弧のパス
              const startX = center + radius * Math.cos((startAngle - 90) * Math.PI / 180);
              const startY = center + radius * Math.sin((startAngle - 90) * Math.PI / 180);
              const endX = center + radius * Math.cos((endAngle - 90) * Math.PI / 180);
              const endY = center + radius * Math.sin((endAngle - 90) * Math.PI / 180);
              
              // 円弧の描画フラグ
              const largeArcFlag = segmentAngle > 180 ? 1 : 0;
              
              // パスを生成
              const path = `
                M ${center} ${center}
                L ${startX} ${startY}
                A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}
                Z
              `;
              
              totalAngle += segmentAngle;
              
              return (
                <path
                  key={index}
                  d={path}
                  fill={segment.color}
                  className="transition-colors duration-200 hover:brightness-90"
                >
                  <title>{segment.label}: {formatHours(segment.value)}</title>
                </path>
              );
            })}
            
            {/* 中央の円（くり抜き） */}
            <circle 
              cx={center} 
              cy={center} 
              r={radius - strokeWidth / 2} 
              fill="white"
            />
            
            {/* 超過警告アイコン（超過時のみ表示） */}
            {data.totalHours > maxHours && (
              <g transform={`translate(${center - 15}, ${center - 25})`}>
                <path 
                  d="M8.865 1.52c-.18-.31-.51-.5-.87-.5s-.69.19-.87.5L.275 13.5c-.18.31-.18.69 0 1 .19.31.52.5.87.5h13.7c.36 0 .69-.19.86-.5.17-.31.18-.69.01-1L8.865 1.52zM8.995 13h-2v-2h2v2zm0-3h-2V6h2v4z" 
                  fill="#EF4444"
                />
              </g>
            )}
            
            {/* 中央のテキスト（合計時間） */}
            <text
              x={center}
              y={center - 5}
              textAnchor="middle"
              fontSize="14"
              fontWeight="bold"
              fill={data.totalHours > maxHours ? "#EF4444" : "#374151"} // 超過時は赤色
            >
              {formatHours(data.totalHours)}
            </text>
            
            {/* 中央のテキスト（上限時間） */}
            <text
              x={center}
              y={center + 12}
              textAnchor="middle"
              fontSize="10"
              fill={data.totalHours > maxHours ? "#EF4444" : "#6B7280"} // 超過時は赤色
            >
              / {formatHours(maxHours)}
            </text>
          </svg>
          
          {/* ホバー時の詳細情報 */}
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white bg-opacity-80 p-1 rounded-md shadow-sm text-xs">
              <div className={`text-center font-medium ${data.totalHours > maxHours ? "text-red-500" : ""}`}>
                {data.totalHours - maxHours}h
                {data.totalHours > maxHours && " 超過"}
              </div>
            </div>
          </div>
        </div>
        <div className="text-xs text-center mt-2">
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                if (title.toLowerCase() === 'day') {
                  const newDate = subDays(dayDate, 1);
                  setDayDate(newDate);
                } else if (title.toLowerCase() === 'week') {
                  const newDate = subWeeks(weekDate, 1);
                  setWeekDate(newDate);
                } else if (title.toLowerCase() === 'month') {
                  const newDate = subMonths(monthDate, 1);
                  setMonthDate(newDate);
                }
              }}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <IoChevronBack className="w-3 h-3" />
            </button>
            <span className="mx-1">
              {title.toLowerCase() === 'day' && dateRanges.day.label}
              {title.toLowerCase() === 'week' && dateRanges.week.label}
              {title.toLowerCase() === 'month' && dateRanges.month.label}
            </span>
            <button
              type="button"
              onClick={() => {
                if (title.toLowerCase() === 'day') {
                  const newDate = addDays(dayDate, 1);
                  setDayDate(newDate);
                } else if (title.toLowerCase() === 'week') {
                  const newDate = addWeeks(weekDate, 1);
                  setWeekDate(newDate);
                } else if (title.toLowerCase() === 'month') {
                  const newDate = addMonths(monthDate, 1);
                  setMonthDate(newDate);
                }
              }}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <IoChevronForward className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // 凡例コンポーネント
  const Legend = () => (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mb-2 mt-1">
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
        <span className="text-xs">外部予定</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
        <span className="text-xs">内部TODO</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>
        <span className="text-xs">バッファ</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full bg-gray-200 mr-1"></div>
        <span className="text-xs">空き時間</span>
      </div>
    </div>
  );
  
  // 各期間の最大時間を計算
  // const dayMaxHours = dayData.totalHours + dayData.freeHours;
  // const weekMaxHours = weekData.totalHours + weekData.freeHours;
  // const monthMaxHours = monthData.totalHours + monthData.freeHours;
  const dayMaxHours = 8;
  const weekMaxHours = 40;
  const monthMaxHours = 160;
  
  return (
    <div className="bg-white rounded-lg shadow p-4 w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium flex items-center">
          <FaClock className="mr-2 text-gray-500" />
          工数集計
        </h3>
      </div>
      
      <Legend />
      
      <div className="flex flex-wrap justify-center gap-6 pt-2">
        <DonutChart data={dayData} maxHours={dayMaxHours} title="day" />
        <DonutChart data={weekData} maxHours={weekMaxHours} title="week" />
        <DonutChart data={monthData} maxHours={monthMaxHours} title="month" />
      </div>
    </div>
  );
} 