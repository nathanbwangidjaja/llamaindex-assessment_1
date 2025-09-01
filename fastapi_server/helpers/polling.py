import asyncio
from dataclasses import dataclass
from typing import Callable, Awaitable

@dataclass
class Timeout:
    seconds: int = 300
    interval: float = 1.5

async def poll(async_fn: Callable[[], Awaitable[bool]], timeout: Timeout = Timeout()):
    """Call async_fn repeatedly until it returns True or we time out."""
    elapsed = 0.0
    while elapsed < timeout.seconds:
        if await async_fn():
            return True
        await asyncio.sleep(timeout.interval)
        elapsed += timeout.interval
    return False
