import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification, addToast } from '../store/UiSlice';

const simulatedEvents = [
    {
        title: 'Sara Khan commented',
        message: 'Sara Khan left a note on "Omnibar command palette redesign"',
        type: 'mention'
    },
    {
        title: 'Task Assigned',
        message: 'Ali Raza assigned you to "Sprint 34 Documentation"',
        type: 'assigned'
    },
    {
        title: 'Subtask Completed',
        message: 'Sara Khan completed "Support fuzzy filter over projects"',
        type: 'assigned'
    }
];

export function useSimulatedLiveUpdates() {
    const dispatch = useDispatch();
    const isOnline = useSelector((state) => state.ui.isOnline);

    useEffect(() => {
        if (!isOnline) return;

        // Push a simulated live update after 45 seconds to showcase real-time simulation
        let eventIndex = 0;
        const interval = setInterval(() => {
            const event = simulatedEvents[eventIndex % simulatedEvents.length];
            dispatch(addNotification(event));
            dispatch(addToast({
                message: `Live update: ${event.message}`,
                type: 'info'
            }));
            eventIndex++;
        }, 45000);

        return () => clearInterval(interval);
    }, [dispatch, isOnline]);
}
