#!/bin/bash

N=$1
TARGET_DIR=$2

mkdir -p $TARGET_DIR

# Delete any existing files in the target directory
rm -f $TARGET_DIR/*

echo "Deleted any existing files in $TARGET_DIR."

echo "Retrieving the last $N logs..."

# Retrieve the log list in JSON format and parse IDs and timestamps
log_list=$(sfdx force:apex:log:list --json)

# Extract log IDs and their corresponding timestamps, sort by timestamp, and get the last N logs
log_ids=$(echo $log_list | jq -r '.result | sort_by(.StartTime) | reverse | .[].Id' | head -n $N)

echo "Log IDs: $log_ids"

# Convert log_ids into an array
log_ids_array=($log_ids)

for log_id in "${log_ids_array[@]}"; do
    echo "Retrieving log with ID $log_id"
    
    # Retrieve the log and save it directly to the target directory
    sfdx force:apex:log:get --log-id $log_id --output-dir $TARGET_DIR
    
    # Identify the most recent file in the target directory
    log_filename=$(ls -t $TARGET_DIR | head -n 1)
    
    echo "Log filename: $log_filename"
    
    if [ -f "$TARGET_DIR/$log_filename" ]; then
        echo "Log $log_filename successfully saved to $TARGET_DIR"
    else
        echo "Log file $log_filename not found in $TARGET_DIR!"
    fi
done

echo "Finished."