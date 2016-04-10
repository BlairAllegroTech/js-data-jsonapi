before(function () {
    examples = examples || {};
    examples.manyToMany = examples.manyToMany || {};
    
    // Here:
    // Article (*) <--> (*) Author
    // Article (1) <--> (*) Comment       
    
    // To do this we create a joining table
    // Article (*) <-- (1) ArticleAuthors (1)--> (*) Author
    // Article (1) <--> (*) Comment            
    examples.manyToMany.config = function (ds) {
        
        // This is the joining table that links Articles and Authors
        var ArticleAuthors = ds.defineResource( {
            name: 'article_to_person',
            idAttribute: 'id',
            
            relations: {
                belongsTo: {
                    article: {
                        localField: 'article',
                        localKey: 'articleid'
                    },
                    person: {
                        localField: 'author',
                        localKey: 'personid'
                    }
                }
            }
        }); 

        var Article = ds.defineResource({
            name: 'article',
            idAttribute: 'id',
            meta: {
                // Tells adapter that this is a joining table to person used for many to many relations
                article_person : { type: 'person', joinType: 'article_to_person' }
            },
            relations: {
                // hasMany uses "localField" and "localKeys" or "foreignKey"
                // In the case of one to many we use foreignKey
                hasMany: {
                    article_to_person: {
                        localField: 'article_person',
                        foreignKey: 'articleid'
                    }
                }
            }
        });
        
        var Person = ds.defineResource({
            name: 'person',
            idAttribute: 'id',
            meta: {
                // Tells adapter that this is a joining table to article used for many to many relations
                person_article : { type: 'article', joinType: 'article_to_person' }
            },
            relations: {
                // hasMany uses "localField" and "localKeys" or "foreignKey"                
                hasMany: {
                    article_to_person: {
                        localField: 'person_article',
                        foreignKey: 'personid'
                    }
                }
            }
        });
        
        
        
        return {
            article: Article,
            person: Person,
            
            // Joining tble
            articleauthors: ArticleAuthors
        };
    }
});