export const calculateHeight = (setRemainingHeight: (height: number) => void): void => {
    const topComponent = document.querySelector('[data-name="AppBar"]');
    const secondComponent = document.querySelector('[data-name="GridToolbar"]');
    const thirdComponent = document.querySelector('[data-name="GridMenu"]');

    const topHeight = topComponent ? (topComponent as HTMLElement).offsetHeight : 0;
    const secondHeight = secondComponent ? (secondComponent as HTMLElement).offsetHeight : 0;
    const thirdHeight = thirdComponent ? (thirdComponent as HTMLElement).offsetHeight : 0;

    const totalHeight = topHeight + secondHeight + thirdHeight + 60;
    setRemainingHeight(window.innerHeight - totalHeight);
};