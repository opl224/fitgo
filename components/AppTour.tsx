import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Portal,
  Text,
  VStack,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'motion/react';
import { GriddyIcon } from './GriddyIcon';

interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface AppTourProps {
  t: any;
  hasSeenTour?: boolean;
  setHasSeenTour?: (seen: boolean) => void;
}

export const AppTour: React.FC<AppTourProps> = ({ t, hasSeenTour, setHasSeenTour }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps: TourStep[] = [
    {
      targetId: 'tour-profile',
      title: t.tourProfileTitle,
      content: t.tourProfileDesc,
      position: 'bottom',
    },
    {
      targetId: 'tour-weather',
      title: t.tourWeatherTitle,
      content: t.tourWeatherDesc,
      position: 'bottom',
    },
    {
      targetId: 'tour-run',
      title: t.tourRunTitle,
      content: t.tourRunDesc,
      position: 'top',
    },
    {
      targetId: 'tour-workout',
      title: t.tourWorkoutTitle,
      content: t.tourWorkoutDesc,
      position: 'top',
    },
    {
      targetId: 'tour-action-center',
      title: t.tourActionTitle,
      content: t.tourActionDesc,
      position: 'top',
    },
  ];

  const updateTargetRect = useCallback(() => {
    const element = document.getElementById(steps[currentStep].targetId);
    if (element) {
      setTargetRect(element.getBoundingClientRect());
    }
  }, [currentStep, steps]);

  useEffect(() => {
    if (hasSeenTour === false) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [hasSeenTour]);

  useEffect(() => {
    if (isVisible) {
      updateTargetRect();
      window.addEventListener('resize', updateTargetRect);
      window.addEventListener('scroll', updateTargetRect);
    }
    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect);
    };
  }, [isVisible, updateTargetRect]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    if (setHasSeenTour) setHasSeenTour(true);
  };

  if (!isVisible || !targetRect) return null;

  const step = steps[currentStep];

  // Calculate tooltip position
  const getTooltipPosition = () => {
    const margin = 12;
    switch (step.position) {
      case 'bottom':
        return {
          top: targetRect.bottom + margin,
          left: Math.max(margin, Math.min(window.innerWidth - 320 - margin, targetRect.left + targetRect.width / 2 - 160)),
        };
      case 'top':
        return {
          bottom: window.innerHeight - targetRect.top + margin,
          left: Math.max(margin, Math.min(window.innerWidth - 320 - margin, targetRect.left + targetRect.width / 2 - 160)),
        };
      default:
        return { top: 0, left: 0 };
    }
  };

  const pos = getTooltipPosition();

  return (
    <Portal>
      {/* Backdrop with hole */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={2000}
        bg="blackAlpha.700"
        pointerEvents="auto"
        style={{
          clipPath: `polygon(
            0% 0%, 
            0% 100%, 
            ${targetRect.left}px 100%, 
            ${targetRect.left}px ${targetRect.top}px, 
            ${targetRect.right}px ${targetRect.top}px, 
            ${targetRect.right}px ${targetRect.bottom}px, 
            ${targetRect.left}px ${targetRect.bottom}px, 
            ${targetRect.left}px 100%, 
            100% 100%, 
            100% 0%
          )`,
        }}
        onClick={handleSkip}
      />

      {/* Highlight Border (Hidden or made transparent to remove blue line) */}
      <motion.div
        initial={false}
        animate={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
        }}
        style={{
          position: 'fixed',
          zIndex: 2001,
          border: 'none', // Removed blue border
          borderRadius: '16px',
          pointerEvents: 'none',
          boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.3)', // Subtle white glow instead of solid blue
        }}
      />

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: step.position === 'top' ? 10 : -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={{
            position: 'fixed',
            ...pos,
            width: '320px',
            zIndex: 2002,
            pointerEvents: 'auto',
          }}
        >
          <Box
            bg="white"
            _dark={{ bg: "gray.800", borderColor: "gray.700" }}
            p={6}
            borderRadius="24px"
            shadow="2xl"
            border="1px solid"
            borderColor="gray.100"
          >
            <VStack align="stretch" gap={4}>
              <HStack justify="space-between">
                <Text fontSize="xs" fontWeight="black" color="blue.500" textTransform="uppercase" letterSpacing="widest">
                  Langkah {currentStep + 1} dari {steps.length}
                </Text>
                <IconButton
                  aria-label="Skip"
                  variant="ghost"
                  size="xs"
                  onClick={handleSkip}
                  _focus={{ boxShadow: 'none' }}
                  _focusVisible={{ outline: 'none' }}
                >
                  <GriddyIcon name="X" size={16} />
                </IconButton>
              </HStack>
              
              <VStack align="start" gap={1}>
                <Text fontSize="lg" fontWeight="black" color="gray.800" _dark={{ color: "white" }} textTransform="uppercase" letterSpacing="tighter">
                  {step.title}
                </Text>
                <Text fontSize="sm" color="gray.500" fontWeight="medium" lineHeight="tall">
                  {step.content}
                </Text>
              </VStack>

              <HStack justify="space-between" pt={2}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  fontSize="xs"
                  fontWeight="black"
                  textTransform="uppercase"
                  _focus={{ boxShadow: 'none' }}
                  _focusVisible={{ outline: 'none' }}
                >
                  <HStack gap={2}>
                    <GriddyIcon name="ArrowLeft" size={14} />
                    <Text>{t.previous || 'Kembali'}</Text>
                  </HStack>
                </Button>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={handleNext}
                  borderRadius="xl"
                  fontSize="xs"
                  fontWeight="black"
                  textTransform="uppercase"
                  px={6}
                  _focus={{ boxShadow: 'none' }}
                  _focusVisible={{ outline: 'none' }}
                >
                  <HStack gap={2}>
                    <Text>{currentStep === steps.length - 1 ? (t.finish || 'Selesai') : (t.next || 'Lanjut')}</Text>
                    <GriddyIcon 
                      name={currentStep === steps.length - 1 ? "Check" : "ArrowRight"} 
                      size={14} 
                    />
                  </HStack>
                </Button>
              </HStack>
            </VStack>
          </Box>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
};
