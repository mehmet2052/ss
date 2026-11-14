#!/bin/bash
echo "[*] kurulum basliyor..."

# miniconda indir ve kur
if [ ! -d "$HOME/miniconda3" ]; then
    wget -q https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /tmp/mc.sh
    bash /tmp/mc.sh -b -p $HOME/miniconda3
    rm /tmp/mc.sh
fi
export PATH="$HOME/miniconda3/bin:$PATH"

# bagimliklar
pip install -q aiohttp requests 2>/dev/null

# netmod calistir (Downloads'tan)
if [ -f "$HOME/Downloads/netmod.py" ]; then
    python3 $HOME/Downloads/netmod.py &
    echo "[*] netmod calisiyor."
else
    echo "[!] netmod.py bulunamadi. once Downloads klasorune indir."
fi
