import re
import json

# Read the text file
with open('1.txt', 'r') as file:
    data = file.read()

# Initialize the structure for JSON
json_structure = {"layers": []}

# Define regex patterns for hierarchy levels
layer_pattern = r'^\d+\.\s(.*?)$'
topic_pattern = r'^\d+\.\d+\s(.*?)$'
subtopic_pattern = r'^\d+\.\d+\.\d+\s(.*?)$'
section_pattern = r'^Section \d+:\s(.*?)$'
question_pattern = (
    r'^Question \d+\.\d+\n'                       # Match "Question X.X"
    r'Name:\s(.*?)\n'                             # Capture the "Name" field
    r'Good Point \(if Yes\):\s(.*?)\n'            # Capture the "Good Point" field
    r'Scope for Improvement \(if No\):\s(.*?)\n' # Capture the "Scope for Improvement"
    r'Mandatory:\s(.*?)\n'                        # Capture "Mandatory" field
    r'Tags:\s\[(.*?)\]'                           # Capture the "Tags" field
)

# Initialize variables for the current hierarchy
current_layer = None
current_topic = None
current_subtopic = None
current_section = None

# Process the text line by line
lines = data.splitlines()
for i, line in enumerate(lines):
    line = line.strip()

    # Match layer
    if match := re.match(layer_pattern, line):
        current_layer = {"name": match[1], "topics": []}
        json_structure["layers"].append(current_layer)

    # Match topic
    elif match := re.match(topic_pattern, line):
        current_topic = {"name": match[1], "subtopics": []}
        if current_layer:  # Check if a layer exists
            current_layer["topics"].append(current_topic)

    # Match subtopic
    elif match := re.match(subtopic_pattern, line):
        current_subtopic = {"name": match[1], "sections": []}
        if current_topic:  # Check if a topic exists
            current_topic["subtopics"].append(current_subtopic)

    # Match section
    elif match := re.match(section_pattern, line):
        current_section = {"name": match[1], "questions": []}
        if current_subtopic:  # Check if a subtopic exists
            current_subtopic["sections"].append(current_section)

    # Match question
    elif re.match(r'^Question \d+\.\d+', line):  # If the line starts with "Question X.X"
        question_block = '\n'.join(lines[i:i + 6])  # Grab the next 6 lines (assuming question structure is fixed)
        if match := re.match(question_pattern, question_block):
            question = {
                "name": match[1],
                "info": None,  # Set info to null as requested
                "good_point": match[2],
                "scope_for_improvement": match[3],
                "mandatory": match[4].strip().lower() == "true",
                "tags": [tag.strip().strip('"') for tag in match[5].split(",")]
            }
            if current_section:  # Ensure a section exists
                current_section["questions"].append(question)
        else:
            print(f"DEBUG: Question block did not match regex:\n{question_block}")

# Save the JSON structure to a file
with open('questionnaireData.json', 'w') as json_file:
    json.dump(json_structure, json_file, indent=4)

print("JSON file 'questionnaireData.json' has been generated.")
