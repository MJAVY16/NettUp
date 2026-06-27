/**
 * Number Input Spinner Utility
 * Adds clickable spinner functionality to number inputs
 */

export function initNumberInputSpinners() {
  let holdInterval: NodeJS.Timeout | null = null;
  let holdTimeout: NodeJS.Timeout | null = null;
  let holdCount = 0;

  const updateValue = (input: HTMLInputElement, increment: boolean) => {
    const step = parseFloat(input.step) || 1;
    const currentValue = parseFloat(input.value) || 0;

    // Determine decimal places from step (e.g., 0.01 = 2 decimal places)
    const decimalPlaces = step.toString().includes('.')
      ? step.toString().split('.')[1].length
      : 0;

    let newValue: number;
    if (increment) {
      // Increment
      newValue = currentValue + step;
      const max = input.max ? parseFloat(input.max) : Infinity;
      newValue = Math.min(newValue, max);
    } else {
      // Decrement
      newValue = currentValue - step;
      const min = input.min ? parseFloat(input.min) : -Infinity;
      newValue = Math.max(newValue, min);
    }

    // Round to avoid floating point precision issues
    newValue = parseFloat(newValue.toFixed(decimalPlaces));
    input.value = newValue.toString();

    // Trigger change event so React updates
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const startHolding = (input: HTMLInputElement, increment: boolean) => {
    // Clear any existing intervals
    if (holdInterval) clearInterval(holdInterval);
    if (holdTimeout) clearTimeout(holdTimeout);

    holdCount = 0;

    // Initial delay before starting continuous updates
    holdTimeout = setTimeout(() => {
      // Start continuous updates
      const runUpdate = () => {
        updateValue(input, increment);
        holdCount++;

        // Accelerate over time
        if (holdInterval) clearInterval(holdInterval);

        // Speed increases as you hold longer
        const speed = Math.max(20, 120 - (holdCount * 8)); // Starts at 120ms, gets faster, min 20ms
        holdInterval = setTimeout(runUpdate, speed);
      };

      runUpdate();
    }, 150); // Initial delay before starting continuous updates
  };

  const stopHolding = () => {
    if (holdInterval) {
      clearInterval(holdInterval);
      holdInterval = null;
    }
    if (holdTimeout) {
      clearTimeout(holdTimeout);
      holdTimeout = null;
    }
    holdCount = 0;
  };

  // Add mousedown handler for click-and-hold
  document.addEventListener('mousedown', (e) => {
    const target = e.target as HTMLElement;

    // Check if click is on a number input
    if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'number') {
      const input = target as HTMLInputElement;
      const rect = input.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Check if click is in the right 25px (spinner area)
      if (clickX > rect.width - 25) {
        e.preventDefault();

        // Determine if incrementing or decrementing
        const increment = clickY < rect.height / 2;

        // First click - immediate update
        updateValue(input, increment);

        // Start holding
        startHolding(input, increment);
      }
    }
  });

  // Stop holding on mouseup
  document.addEventListener('mouseup', () => {
    stopHolding();
  });

  // Stop holding if mouse leaves the window
  document.addEventListener('mouseleave', () => {
    stopHolding();
  });

  // Add cursor pointer for spinner area on hover
  document.addEventListener('mousemove', (e) => {
    const target = e.target as HTMLElement;

    if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'number') {
      const input = target as HTMLInputElement;
      const rect = input.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;

      // If hovering over spinner area (right 25px), show pointer cursor
      if (mouseX > rect.width - 25) {
        input.style.cursor = 'pointer';
      } else {
        input.style.cursor = 'text';
      }
    }
  });
}
