# MIDI Testing Guide - Flawless DAWless

## 🎯 Overview

This guide will help you test the MIDI communication functionality of Flawless DAWless on macOS. We'll start with virtual MIDI (no hardware needed) and then move to real hardware testing.

## 📋 Prerequisites

- macOS (Monterey 12.0+ recommended)
- Flawless DAWless development server running (`npm run dev`)
- Optional: Roland Verselab MV-1 hardware

## 🔧 Phase 1: Virtual MIDI Testing (No Hardware Required)

### Step 1: Set Up IAC Driver (macOS Built-in Virtual MIDI)

1. **Open Audio MIDI Setup**
   - Press `Cmd + Space` and search for "Audio MIDI Setup"
   - Or go to Applications → Utilities → Audio MIDI Setup

2. **Enable IAC Driver**
   - In Audio MIDI Setup, go to Window → Show MIDI Studio
   - Find "IAC Driver" in the list
   - Double-click on "IAC Driver"
   - Check the box "Device is online"
   - Click "Apply"

3. **Verify IAC Driver is Active**
   - You should see "IAC Driver Bus 1" listed
   - The device should show as "Online"

### Step 2: Test Device Detection

1. **Start Flawless DAWless**
   - Open http://localhost:5173 in your browser
   - Look at the browser console (F12 → Console)

2. **Check Device List**
   - In the sidebar, you should see a "MIDI Device" dropdown
   - Click the dropdown - you should see "IAC Driver Bus 1" listed
   - If not visible, click "Refresh Devices"

3. **Expected Console Output**
   ```
   Available MIDI devices: [{index: 0, name: "IAC Driver Bus 1"}]
   ```

### Step 3: Test Connection

1. **Connect to IAC Driver**
   - Select "IAC Driver Bus 1" from the dropdown
   - Click "Connect"
   - The button should change to "Connected"
   - Status indicator should turn green

2. **Expected Console Output**
   ```
   Found device: IAC Driver Bus 1 at port 0
   Successfully connected to IAC Driver Bus 1
   MV1Device connected to: IAC Driver Bus 1
   MIDI connection test successful
   ```

### Step 4: Test Sound Selection

1. **Click Test Sound Selection**
   - With IAC Driver connected, click "Test Sound Selection" button
   - This will send Bank Select and Program Change messages

2. **Expected Console Output**
   ```
   Selecting sound: Sat.808+SynthBD1 (Bank: 0, Program: 1) on channel 1
   Sound selection complete: Sat.808+SynthBD1
   ```

## 🔍 Phase 2: MIDI Monitoring (Verify Messages)

### Step 1: Install MIDI Monitor

1. **Download MIDI Monitor**
   - Go to https://www.snoize.com/MIDIMonitor/
   - Download the free MIDI Monitor app
   - Install and open it

2. **Connect MIDI Monitor to IAC Driver**
   - In MIDI Monitor, go to Sources → IAC Driver Bus 1
   - Check the box to enable monitoring

### Step 2: Monitor MIDI Messages

1. **Send Test Messages**
   - In Flawless DAWless, click "Test Sound Selection"
   - Watch MIDI Monitor for incoming messages

2. **Expected MIDI Messages**
   ```
   Channel 1: Control Change 0 (Bank Select MSB) = 0
   Channel 1: Control Change 32 (Bank Select LSB) = 0  
   Channel 1: Program Change = 0
   ```

3. **Verify Message Format**
   - Messages should appear in real-time
   - Channel should be 1 (kick track)
   - CC values should match the sound's bank/program

## 🎹 Phase 3: Real Hardware Testing (MV-1)

### Step 1: Connect MV-1 Hardware

1. **Physical Connection**
   - Connect MV-1 to Mac via USB-B cable
   - Power on the MV-1
   - Set MV-1 to MIDI receive mode (check manual)

2. **Verify Device Recognition**
   - In Flawless DAWless, click "Refresh Devices"
   - Look for "VERSELAB MV-1" or "MV-1" in the dropdown
   - Device should appear in the list

### Step 2: Test Real Connection

1. **Connect to MV-1**
   - Select the MV-1 device from dropdown
   - Click "Connect"
   - Status should show "Connected"

2. **Test Sound Selection**
   - Click "Test Sound Selection"
   - **Expected Result**: Kick track on MV-1 should change to the selected sound
   - If it doesn't work, check console for error messages

### Step 3: Troubleshoot Hardware Issues

**Common Issues:**

1. **Device Not Found**
   - Check USB cable connection
   - Try different USB port
   - Restart MV-1
   - Check MV-1 MIDI settings

2. **Connection Fails**
   - Close other MIDI software (DAWs, etc.)
   - Restart Flawless DAWless
   - Check MV-1 is in correct mode

3. **Sound Doesn't Change**
   - Verify MV-1 is receiving MIDI
   - Check track is not muted
   - Try different sound ID in test

## 🐛 Troubleshooting

### Console Error Messages

**"Device not found"**
- Check device name spelling
- Verify device is powered on
- Try "Refresh Devices"

**"Not connected to MIDI device"**
- Ensure connection was successful
- Check green status indicator
- Try reconnecting

**"Sound not found"**
- Verify sound ID exists in database
- Check mv1-sounds.json file

### MIDI Message Issues

**No messages in MIDI Monitor**
- Check IAC Driver is enabled
- Verify MIDI Monitor is connected to correct port
- Try restarting both applications

**Wrong channel numbers**
- MV-1 uses channels 1-7 for tracks
- Channel 1 = Kick, Channel 2 = Snare, etc.
- Check track mapping in code

### Performance Issues

**Slow MIDI response**
- Add delays between messages (already implemented)
- Check USB cable quality
- Close background applications

## 📊 Expected Results Summary

### Virtual MIDI (IAC Driver)
✅ Device appears in dropdown  
✅ Connection successful  
✅ MIDI messages sent to IAC Driver  
✅ Messages visible in MIDI Monitor  

### Real Hardware (MV-1)
✅ Device appears as "VERSELAB MV-1" or "MV-1"  
✅ Connection successful  
✅ Test sound selection changes kick track  
✅ Console shows successful MIDI communication  

## 🚀 Next Steps

Once basic MIDI communication is working:

1. **Test Pattern Sending**
   - Implement `sendPattern()` method
   - Send simple kick patterns
   - Verify timing and note placement

2. **Test Multiple Tracks**
   - Select sounds on different tracks (channels 2-7)
   - Verify track mapping works correctly

3. **Test Genre Engine Integration**
   - Generate trap patterns
   - Send complete songs to MV-1
   - Verify all tracks receive correct sounds

## 📝 Notes

- All MIDI messages are logged to console for debugging
- Bank Select uses CC #0 (MSB) and CC #32 (LSB)
- Program Change is 0-based (subtract 1 from PDF values)
- MV-1 track channels: 1=Kick, 2=Snare, 3=HiHat, 4=Kit, 5=Bass, 6=Inst1, 7=Inst2

## 🆘 Getting Help

If you encounter issues:

1. Check browser console for error messages
2. Verify MIDI device is properly connected
3. Test with IAC Driver first (virtual MIDI)
4. Check MV-1 manual for MIDI settings
5. Try different USB cable/port

The MIDI communication is the foundation for all hardware control, so getting this working is critical for the entire application!
