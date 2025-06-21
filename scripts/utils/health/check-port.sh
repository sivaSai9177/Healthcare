#!/bin/bash

# Check if a port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Port $port is already in use"
        return 1
    else
        echo "Port $port is available"
        return 0
    fi
}

# Kill process using a specific port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pids" ]; then
        echo "Killing processes using port $port: $pids"
        kill -9 $pids 2>/dev/null
        sleep 1
    fi
}

# Main function
if [ "$1" = "check" ]; then
    check_port $2
elif [ "$1" = "kill" ]; then
    kill_port $2
else
    echo "Usage: $0 [check|kill] <port>"
    exit 1
fi