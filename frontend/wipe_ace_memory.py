from neo4j import GraphDatabase
import os

URI = "neo4j+s://658ee782.databases.neo4j.io"
USER = "neo4j"
PASSWORD = "LhnKxB7S8BgGnMc8Wihk8CO9eOtE5bpe6qEt3a66e8o"

def wipe_memory():
    driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))
    with driver.session() as session:
        # Delete AceMemoryState
        result1 = session.run("MATCH (n:AceMemoryState) DETACH DELETE n RETURN count(n) as deleted")
        print(f"Deleted {result1.single()['deleted']} AceMemoryState nodes.")
        
        # Delete ACEMemoryBullet
        result2 = session.run("MATCH (n:ACEMemoryBullet) DETACH DELETE n RETURN count(n) as deleted")
        print(f"Deleted {result2.single()['deleted']} ACEMemoryBullet nodes.")
        
        # Delete ACEMemory
        result3 = session.run("MATCH (n:ACEMemory) DETACH DELETE n RETURN count(n) as deleted")
        print(f"Deleted {result3.single()['deleted']} ACEMemory nodes.")

    driver.close()

if __name__ == "__main__":
    wipe_memory()
