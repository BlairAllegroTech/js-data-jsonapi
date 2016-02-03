before(function () {
    examples = examples || {};                
    examples.oneToMany = examples.oneToMany || {};
    

    examples.oneToMany.config = function (ds) {

        var Article = ds.defineResource({
            name: 'article',
            idAttribute: 'id',
            relations: {
                // hasMany uses "localField" and "localKeys" or "foreignKey"
                hasOne: {
                    author: {
                        localField: 'author',
                        foreignKey: 'articleid'
                    },
                },
                
                hasMany: {
                    comment: {
                        localField: 'comments',
                        foreignKey: 'articleid'
                    }
                }
            }
        });
        
        var Author = ds.defineResource({
            name: 'author',
            idAttribute: 'id',
            relations: {
                // hasMany uses "localField" and "localKeys" or "foreignKey"
                belongsTo: {
                    article: {
                        localField: 'article',
                        localKey: 'articleid'
                    }
                }
            }
        });
        
        var Comment = ds.defineResource({
            name: 'comment',
            idAttribute: 'id',
            relations: {
                // hasMany uses "localField" and "localKeys" or "foreignKey"
                belongsTo: {
                    article: {
                        localField: 'article',
                        localKey: 'articleid'
                    }
                },
                hasOne: {
                    author: {
                        localField: 'author',
                        localKey: 'authorid'
                    }
                }
            }
        });


        return {
            article: Article,
            author: Author,
            comment: Comment
        };
    }
});