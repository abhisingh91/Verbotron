import json, random

def shuffle_synonyms_antonyms(filename):
    with open(filename, "r", encoding="utf-8") as file:
        data = json.load(file)
    
    for difficulty in ["easy", "medium", "hard"]:
        for word_data in data.get(difficulty, []):
            random.shuffle(word_data["synonyms"])
            random.shuffle(word_data["antonyms"])

    with open(filename, "w", encoding="utf-8") as file:
        formatted_data = json.dumps(data, separators=(",", ":"), indent=None)
        formatted_data = formatted_data.replace("},", "},\n")  # Ensures line breaks after each entry
        file.write(formatted_data + "\n")

# Example usage
filename = "frontend/my-app/public/data/wordVerse.json"
shuffle_synonyms_antonyms(filename)