import { useEffect, useState } from "react";

// hooks/ — QUY TẮC BẮT BUỘC: tuyệt đối không hook nào gọi API/useQuery ở đây.
// Đây là client state thuần (giá trị debounce của 1 ô input), không phải server state.
export function useDebounce(value, delayMs = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
