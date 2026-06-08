from openai import OpenAI

client = OpenAI()

def analyze_contract(context):

    prompt = f"""
    Analyze the following contract.

    Return ONLY JSON.

    {{
        "summary": "",
        "obligations": [],
        "risks": [],
        "recommendations": []
    }}

    Contract:
    {context}
    """

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response.choices[0].message.content