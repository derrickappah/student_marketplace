import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToNotifications } from '../services/notificationService';
import NotificationToast from './NotificationToast';

/**
 * Component to manage real-time notifications and display toast notifications
 * This should be mounted high in the component tree
 */
const NotificationManager = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const subscriptionRef = useRef(null);
  
  useEffect(() => {
    // Clean up function for when the component unmounts or user changes
    const cleanup = () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
    
    // If no user is logged in, clean up and return
    if (!user) {
      cleanup();
      return;
    }
    
    // Subscribe to real-time notifications
    const handleNewNotification = (notification) => {
      // Skip adding duplicates
      setNotifications(prev => {
        if (prev.some(n => n.id === notification.id)) {
          return prev;
        }
        return [notification, ...prev];
      });
      
      // Request browser notification permission if needed and show notification
      if (document.visibilityState !== 'visible' && 'Notification' in window) {
        try {
          if (Notification.permission === 'granted') {
            const notifTitle = notification.type === 'message' 
              ? 'New Message' 
              : 'New Notification';
            
            const notifOptions = {
              body: notification.message,
              icon: '/logo192.png',
              badge: '/logo192.png',
              tag: notification.id
            };
            
            new Notification(notifTitle, notifOptions);
          }
          else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
          }
        } catch (err) {
          console.error('Error showing browser notification:', err);
        }
      }
    };
    
    const handleUpdatedNotification = (notification) => {
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, ...notification } : n)
      );
    };
    
    // Set up subscription
    console.log('Setting up notification subscription for user:', user.id);
    subscriptionRef.current = subscribeToNotifications(
      user.id,
      handleNewNotification,
      handleUpdatedNotification
    );
    
    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      console.log('Requesting notification permission');
      Notification.requestPermission();
    }
    
    return cleanup;
  }, [user]);
  
  // Remove a notification from the local state
  const handleCloseNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };
  
  // Show a maximum of 3 notifications at once
  const visibleNotifications = notifications.slice(0, 3);
  
  if (!user || visibleNotifications.length === 0) {
    return null;
  }
  
  return (
    <>
      {visibleNotifications.map((notification, index) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => handleCloseNotification(notification.id)}
        />
      ))}
    </>
  );
};

export default NotificationManager; 